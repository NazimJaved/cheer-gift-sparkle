
-- Public read (bucket is private but we allow anonymous SELECT via signed/public URL policy)
DROP POLICY IF EXISTS "Course thumbnails public read" ON storage.objects;
CREATE POLICY "Course thumbnails public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Admins upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins upload course thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update course thumbnails" ON storage.objects;
CREATE POLICY "Admins update course thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete course thumbnails" ON storage.objects;
CREATE POLICY "Admins delete course thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'));
