CREATE TABLE IF NOT EXISTS public.deleted_student_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text,
  former_user_id uuid,
  full_name text,
  phone text,
  email text,
  payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  enrollments jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deleted_student_archive TO authenticated;
GRANT ALL ON public.deleted_student_archive TO service_role;

ALTER TABLE public.deleted_student_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view deleted student archive" ON public.deleted_student_archive;
CREATE POLICY "Admins view deleted student archive"
ON public.deleted_student_archive FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));