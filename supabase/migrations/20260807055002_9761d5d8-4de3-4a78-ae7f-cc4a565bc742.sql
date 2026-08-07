REVOKE ALL ON FUNCTION public.next_student_id(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_student_id(integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_student_id_immutable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_student_id_immutable() FROM anon, authenticated;