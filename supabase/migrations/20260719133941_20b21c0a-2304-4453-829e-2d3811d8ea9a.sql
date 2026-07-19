
-- 1) Extend profiles with avatar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) lesson_notes
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.lesson_notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS lesson_notes_user_lesson ON public.lesson_notes(user_id, lesson_id);
CREATE TRIGGER lesson_notes_updated BEFORE UPDATE ON public.lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) lesson_resources
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  resource_type text NOT NULL DEFAULT 'link',
  resource_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lesson_resources TO authenticated;
GRANT ALL ON public.lesson_resources TO service_role;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolled or admin read resources" ON public.lesson_resources FOR SELECT
  TO authenticated USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = lesson_resources.lesson_id AND e.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.lessons l WHERE l.id = lesson_resources.lesson_id AND l.is_free_preview = true
    )
  );
CREATE POLICY "admins manage resources" ON public.lesson_resources FOR ALL
  TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 4) wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 6) achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, kind, course_id)
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

-- 7) learning_streaks
CREATE TABLE IF NOT EXISTS public.learning_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_streaks TO authenticated;
GRANT ALL ON public.learning_streaks TO service_role;
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own streak read" ON public.learning_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- 8) Notification triggers

-- welcome on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.id, 'welcome', 'স্বাগতম!', 'ডিজিটাল আমিনশিপ একাডেমিতে আপনাকে স্বাগতম।', '/dashboard');
  RETURN NEW;
END;
$$;

-- enrollment notify
CREATE OR REPLACE FUNCTION public.on_enrollment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ctitle text; cslug text;
BEGIN
  SELECT title, slug INTO ctitle, cslug FROM public.courses WHERE id = NEW.course_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.user_id, 'enrollment', 'কোর্স আনলক হয়েছে', COALESCE(ctitle,'আপনার কোর্স') || ' এখন শুরু করুন।', '/learn/' || COALESCE(cslug,''));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_enrollment_created ON public.enrollments;
CREATE TRIGGER trg_on_enrollment_created AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.on_enrollment_created();

-- payment approved notify (payments trigger already exists as BEFORE UPDATE; add AFTER for notification)
CREATE OR REPLACE FUNCTION public.on_payment_status_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'payment_approved', 'পেমেন্ট অনুমোদিত', 'আপনার পেমেন্ট অনুমোদিত হয়েছে। কোর্স উপভোগ করুন।', '/dashboard');
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'payment_rejected', 'পেমেন্ট প্রত্যাখ্যাত', 'আপনার পেমেন্টে সমস্যা রয়েছে। যোগাযোগ করুন।', '/payments');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_payment_status_notify ON public.payments;
CREATE TRIGGER trg_on_payment_status_notify AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.on_payment_status_notify();

-- lesson completed → streak + achievement + notify
CREATE OR REPLACE FUNCTION public.on_lesson_progress_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total int; done int; ctitle text;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM true) THEN
    -- streak upsert
    INSERT INTO public.learning_streaks(user_id, current_streak, longest_streak, last_active_date)
    VALUES (NEW.user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = CASE
        WHEN public.learning_streaks.last_active_date = CURRENT_DATE THEN public.learning_streaks.current_streak
        WHEN public.learning_streaks.last_active_date = CURRENT_DATE - 1 THEN public.learning_streaks.current_streak + 1
        ELSE 1 END,
      longest_streak = GREATEST(public.learning_streaks.longest_streak,
        CASE WHEN public.learning_streaks.last_active_date = CURRENT_DATE - 1 THEN public.learning_streaks.current_streak + 1 ELSE 1 END),
      last_active_date = CURRENT_DATE,
      updated_at = now();

    -- course completion check
    SELECT COUNT(*) INTO total FROM public.lessons WHERE course_id = NEW.course_id AND is_published = true;
    SELECT COUNT(*) INTO done FROM public.lesson_progress
      WHERE course_id = NEW.course_id AND user_id = NEW.user_id AND completed = true;
    IF total > 0 AND done >= total THEN
      SELECT title INTO ctitle FROM public.courses WHERE id = NEW.course_id;
      INSERT INTO public.achievements(user_id, kind, course_id, metadata)
      VALUES (NEW.user_id, 'course_complete', NEW.course_id, jsonb_build_object('title', ctitle))
      ON CONFLICT DO NOTHING;
      INSERT INTO public.notifications(user_id, type, title, body, link)
      VALUES (NEW.user_id, 'course_complete', 'কোর্স সম্পন্ন! 🎉', COALESCE(ctitle,'কোর্স') || ' সফলভাবে শেষ করেছেন।', '/profile');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_lesson_progress_complete ON public.lesson_progress;
CREATE TRIGGER trg_on_lesson_progress_complete AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.on_lesson_progress_complete();

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
