CREATE OR REPLACE FUNCTION public.can_read_company_logo(_folder text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id::text = _folder
      AND (is_admin() OR is_staff_of(c.id) OR (is_customer() AND c.active))
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_company_logo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_company_logo(text) TO authenticated;

DROP POLICY IF EXISTS "logos leitura autorizada" ON storage.objects;

CREATE POLICY "logos leitura autorizada"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.can_read_company_logo((storage.foldername(objects.name))[1])
);