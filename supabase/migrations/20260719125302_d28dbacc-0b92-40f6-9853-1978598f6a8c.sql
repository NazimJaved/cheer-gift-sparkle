
CREATE TABLE public.course_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  chapter_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_chapters TO authenticated;
GRANT ALL ON public.course_chapters TO service_role;

ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by everyone"
ON public.course_chapters FOR SELECT
USING (true);

CREATE POLICY "Admins can insert chapters"
ON public.course_chapters FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update chapters"
ON public.course_chapters FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete chapters"
ON public.course_chapters FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_course_chapters_updated_at
BEFORE UPDATE ON public.course_chapters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_course_chapters_course ON public.course_chapters(course_id, chapter_order);

ALTER TABLE public.lessons
  ADD COLUMN chapter_id uuid REFERENCES public.course_chapters(id) ON DELETE SET NULL;

CREATE INDEX idx_lessons_chapter ON public.lessons(chapter_id);
