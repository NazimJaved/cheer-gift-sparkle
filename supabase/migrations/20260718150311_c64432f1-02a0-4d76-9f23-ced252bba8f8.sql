
-- 1) Extend lessons table with new fields
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS is_free_preview boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Backfill slug for existing rows
UPDATE public.lessons SET slug = COALESCE(slug, 'lesson-' || substring(id::text, 1, 8));
ALTER TABLE public.lessons ALTER COLUMN slug SET NOT NULL;

-- Unique slug per course
CREATE UNIQUE INDEX IF NOT EXISTS lessons_course_slug_key ON public.lessons(course_id, slug);
CREATE INDEX IF NOT EXISTS lessons_course_order_idx ON public.lessons(course_id, lesson_order);

-- 2) Replace public SELECT policy so unpublished lessons are hidden;
--    only enrolled users, admins, or free-preview lessons of published courses are visible.
DROP POLICY IF EXISTS "Anyone views lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;

CREATE POLICY "Admins manage lessons"
  ON public.lessons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public views free preview lessons of published courses"
  ON public.lessons FOR SELECT
  USING (
    is_published = true
    AND is_free_preview = true
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.published = true)
  );

CREATE POLICY "Enrolled users view published lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = lessons.course_id AND e.user_id = auth.uid()
    )
  );

-- 3) Lesson progress table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  last_position_seconds integer NOT NULL DEFAULT 0,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS lesson_progress_user_course_idx ON public.lesson_progress(user_id, course_id);

CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
