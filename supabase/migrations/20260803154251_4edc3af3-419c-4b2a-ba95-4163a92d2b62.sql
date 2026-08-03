CREATE POLICY "Admins manage payment method content"
ON public.site_content
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) AND key = 'payment-methods')
WITH CHECK (public.is_admin(auth.uid()) AND key = 'payment-methods');