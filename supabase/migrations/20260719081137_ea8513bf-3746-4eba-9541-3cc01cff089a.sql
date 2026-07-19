
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT payments_method_check CHECK (payment_method IN ('bkash','nagad','rocket'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.on_payment_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.course_id IS NOT NULL THEN
    INSERT INTO public.enrollments (user_id, course_id) VALUES (NEW.user_id, NEW.course_id)
    ON CONFLICT DO NOTHING;
    NEW.reviewed_at := now();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS payments_on_approve ON public.payments;
CREATE TRIGGER payments_on_approve BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.on_payment_approved();

DO $$ BEGIN
  ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

INSERT INTO public.site_content (key, data)
VALUES ('payment-methods', jsonb_build_object(
  'bkash', jsonb_build_object('number','01XXXXXXXXX','type','Personal','instructions','bKash Personal নম্বরে Send Money করুন।'),
  'nagad', jsonb_build_object('number','01XXXXXXXXX','type','Personal','instructions','Nagad Personal নম্বরে Send Money করুন।'),
  'rocket', jsonb_build_object('number','01XXXXXXXXX0','type','Personal','instructions','Rocket নম্বরে টাকা পাঠান।')
))
ON CONFLICT (key) DO NOTHING;
