ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_by uuid;

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.retired_student_ids (
  student_id text PRIMARY KEY,
  user_id uuid,
  full_name text,
  reason text NOT NULL DEFAULT 'deleted',
  retired_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.retired_student_ids TO authenticated;
GRANT ALL ON public.retired_student_ids TO service_role;

ALTER TABLE public.retired_student_ids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view retired student ids" ON public.retired_student_ids;
CREATE POLICY "Admins view retired student ids"
ON public.retired_student_ids FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.reserve_student_id_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.student_id IS NOT NULL THEN
    INSERT INTO public.retired_student_ids (student_id, user_id, full_name, reason)
    VALUES (OLD.student_id, OLD.id, OLD.full_name, 'profile_deleted')
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_reserve_student_id_on_delete ON public.profiles;
CREATE TRIGGER trg_reserve_student_id_on_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.reserve_student_id_on_delete();