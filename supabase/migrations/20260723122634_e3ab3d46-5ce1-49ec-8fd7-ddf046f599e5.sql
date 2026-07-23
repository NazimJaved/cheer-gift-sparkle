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
  VALUES (NEW.id, 'welcome', 'স্বাগতম!', 'JB IT Academy-তে আপনাকে স্বাগতম।', '/dashboard');
  RETURN NEW;
END;
$$;