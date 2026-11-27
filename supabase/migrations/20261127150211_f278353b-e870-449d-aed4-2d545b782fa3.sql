DROP POLICY IF EXISTS "logos leitura autorizada" ON storage.objects;

CREATE POLICY "logos leitura autorizada"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(objects.name))[1]
      AND (
        public.is_admin()
        OR public.is_staff_of(c.id)
        OR (public.is_customer() AND c.active)
      )
  )
);