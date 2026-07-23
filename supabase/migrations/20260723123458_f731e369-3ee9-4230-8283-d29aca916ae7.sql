
CREATE OR REPLACE FUNCTION public.on_payment_submitted_notify_admins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_name text;
  course_title text;
BEGIN
  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.course_id IS NOT NULL THEN
    SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT ur.user_id,
         'payment_submitted',
         'নতুন পেমেন্ট জমা হয়েছে',
         COALESCE(student_name, 'একজন শিক্ষার্থী') ||
           CASE WHEN course_title IS NOT NULL THEN ' — ' || course_title ELSE '' END ||
           ' এর জন্য পেমেন্ট জমা দিয়েছেন। অনুমোদনের অপেক্ষায়।',
         '/admin/payments'
  FROM public.user_roles ur
  WHERE ur.role IN ('admin'::app_role, 'super_admin'::app_role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_payment_submitted_notify_admins ON public.payments;
CREATE TRIGGER trg_on_payment_submitted_notify_admins
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.on_payment_submitted_notify_admins();
