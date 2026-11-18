ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address text;
DROP FUNCTION IF EXISTS public.admin_editar_empresa(uuid,text,text,text,numeric,text,text,boolean);
CREATE FUNCTION public.admin_editar_empresa(_id uuid,_name text,_slug text,_plan text,_monthly_fee numeric,_city text,_logo_url text,_active boolean,_address text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente o admin pode editar empresas.'; END IF;
 _logo_url := nullif(_logo_url,'');
 IF _name IS NULL OR length(btrim(_name)) NOT BETWEEN 2 AND 80 THEN RAISE EXCEPTION 'Nome inválido.'; END IF;
 IF _slug IS NULL OR _slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(_slug)>60 THEN RAISE EXCEPTION 'Endereço inválido.'; END IF;
 IF _plan IS NULL OR _plan NOT IN ('basic','pro','premium') OR _monthly_fee IS NULL OR _monthly_fee::text IN ('NaN','Infinity','-Infinity') OR _monthly_fee<0 OR _monthly_fee>100000 OR _active IS NULL THEN RAISE EXCEPTION 'Plano ou mensalidade inválidos.'; END IF;
 IF length(btrim(_city))>100 THEN RAISE EXCEPTION 'Cidade muito longa.'; END IF;
 IF length(btrim(coalesce(_address,'')))>160 THEN RAISE EXCEPTION 'Endereço da loja muito longo.'; END IF;
 IF _logo_url IS NOT NULL AND _logo_url NOT LIKE 'https://qetuwkkscjjzfsjlfpuw.supabase.co/storage/v1/object/public/company-logos/' || _id::text || '/%' THEN RAISE EXCEPTION 'Logo inválida.'; END IF;
 UPDATE public.companies SET name=btrim(_name),slug=_slug,plan=_plan,monthly_fee=_monthly_fee,city=nullif(btrim(_city),''),address=nullif(btrim(coalesce(_address,'')),''),logo_url=_logo_url,active=_active WHERE id=_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_editar_empresa(uuid,text,text,text,numeric,text,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_editar_empresa(uuid,text,text,text,numeric,text,text,boolean,text) TO authenticated;
DROP FUNCTION IF EXISTS public.lojas_parceiras();
CREATE FUNCTION public.lojas_parceiras()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, city text, address text, rewards jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para descobrir lojas.'; END IF;
 RETURN QUERY SELECT c.id,c.name,c.slug,c.logo_url,c.city,c.address,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',r.name,'cost_points',r.cost_points) ORDER BY r.cost_points)
    FROM (SELECT r2.name,r2.cost_points FROM public.rewards r2 WHERE r2.company_id=c.id AND r2.active ORDER BY r2.cost_points LIMIT 3) r),'[]'::jsonb)
 FROM public.companies c WHERE c.active ORDER BY c.name;
END $$;
REVOKE EXECUTE ON FUNCTION public.lojas_parceiras() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lojas_parceiras() TO authenticated;