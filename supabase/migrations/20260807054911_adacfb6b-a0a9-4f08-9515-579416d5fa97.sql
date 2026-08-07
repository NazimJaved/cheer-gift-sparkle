-- counters
CREATE TABLE IF NOT EXISTS public.student_id_counters (
  year integer PRIMARY KEY,
  last_seq integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.student_id_counters TO service_role;
ALTER TABLE public.student_id_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view student id counters" ON public.student_id_counters
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- profiles column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_key ON public.profiles (student_id);

-- atomic generator
CREATE OR REPLACE FUNCTION public.next_student_id(_year integer DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE y integer; s integer;
BEGIN
  y := COALESCE(_year, EXTRACT(YEAR FROM now())::int);
  INSERT INTO public.student_id_counters (year, last_seq)
  VALUES (y, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_seq = public.student_id_counters.last_seq + 1, updated_at = now()
  RETURNING last_seq INTO s;
  RETURN y::text || s::text;
END;
$$;
REVOKE ALL ON FUNCTION public.next_student_id(integer) FROM public, anon, authenticated;

-- backfill existing profiles in signup order per year
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT id, EXTRACT(YEAR FROM created_at)::int AS y
    FROM public.profiles
    WHERE student_id IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE public.profiles SET student_id = public.next_student_id(r.y) WHERE id = r.id;
  END LOOP;
END $$;

-- assign on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, student_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    public.next_student_id()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.id, 'welcome', 'স্বাগতম!', 'JB IT Academy-তে আপনাকে স্বাগতম।', '/dashboard');
  RETURN NEW;
END;
$function$;

-- make it immutable / never editable, and auto-fill if inserted without one
CREATE OR REPLACE FUNCTION public.enforce_student_id_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.student_id IS NULL THEN
      NEW.student_id := public.next_student_id();
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    NEW.student_id := OLD.student_id;
  ELSIF OLD.student_id IS NULL AND NEW.student_id IS NULL THEN
    NEW.student_id := public.next_student_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_student_id ON public.profiles;
CREATE TRIGGER trg_profiles_student_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_id_immutable();
