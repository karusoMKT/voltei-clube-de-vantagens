ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text, ADD COLUMN IF NOT EXISTS city text;
CREATE POLICY "logos leitura publica" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'company-logos');
CREATE POLICY "admin envia logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos' AND public.is_admin());
CREATE POLICY "admin altera logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'company-logos' AND public.is_admin()) WITH CHECK (bucket_id = 'company-logos' AND public.is_admin());
CREATE POLICY "admin remove logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-logos' AND public.is_admin());
CREATE OR REPLACE FUNCTION public.lojas_parceiras()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, city text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para descobrir lojas.'; END IF;
 RETURN QUERY SELECT c.id,c.name,c.slug,c.logo_url,c.city FROM public.companies c WHERE c.active ORDER BY c.name;
END $$;
CREATE OR REPLACE FUNCTION public.participar_clube(_company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para participar.'; END IF;
 PERFORM 1 FROM public.companies WHERE id=_company_id AND active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Esta loja não está disponível.'; END IF;
 INSERT INTO public.memberships(customer_id,company_id,points_balance) VALUES(auth.uid(),_company_id,0) ON CONFLICT(customer_id,company_id) DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.admin_editar_empresa(_id uuid,_name text,_slug text,_plan text,_monthly_fee numeric,_city text,_logo_url text,_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente o admin pode editar empresas.'; END IF;
 IF _name IS NULL OR length(btrim(_name)) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Nome inválido.'; END IF;
 IF _slug IS NULL OR _slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(_slug)>60 THEN RAISE EXCEPTION 'Endereço inválido.'; END IF;
 IF _plan IS NULL OR _plan NOT IN ('basic','pro','premium') OR _monthly_fee IS NULL OR _monthly_fee::text IN ('NaN','Infinity','-Infinity') OR _monthly_fee<0 OR _monthly_fee>100000 OR _active IS NULL THEN RAISE EXCEPTION 'Plano ou mensalidade inválidos.'; END IF;
 IF length(btrim(_city))>100 THEN RAISE EXCEPTION 'Cidade muito longa.'; END IF;
 IF _logo_url IS NOT NULL AND _logo_url NOT LIKE 'https://qetuwkkscjjzfsjlfpuw.supabase.co/storage/v1/object/public/company-logos/' || _id::text || '/%' THEN RAISE EXCEPTION 'Logo inválida.'; END IF;
 UPDATE public.companies SET name=btrim(_name),slug=_slug,plan=_plan,monthly_fee=_monthly_fee,city=nullif(btrim(_city),''),logo_url=_logo_url,active=_active WHERE id=_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.lojas_parceiras(), public.participar_clube(uuid), public.admin_editar_empresa(uuid,text,text,text,numeric,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lojas_parceiras(), public.participar_clube(uuid), public.admin_editar_empresa(uuid,text,text,text,numeric,text,text,boolean) TO authenticated;