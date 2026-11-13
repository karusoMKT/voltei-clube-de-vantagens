ALTER TABLE public.companies ADD COLUMN google_review_url text, ADD COLUMN google_review_points integer NOT NULL DEFAULT 30 CHECK (google_review_points BETWEEN 1 AND 10000);
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'pesquisa';
CREATE TABLE public.satisfaction_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), customer_id uuid NOT NULL REFERENCES public.profiles(id), rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), points_awarded integer NOT NULL CHECK (points_awarded > 0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,customer_id)
);
GRANT SELECT ON public.satisfaction_responses TO authenticated;
GRANT ALL ON public.satisfaction_responses TO service_role;
ALTER TABLE public.satisfaction_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "respostas da pesquisa" ON public.satisfaction_responses FOR SELECT TO authenticated USING ((public.is_customer() AND customer_id=auth.uid()) OR public.is_owner_of(company_id) OR public.is_admin());
CREATE OR REPLACE FUNCTION public.salvar_configuracao_pesquisa(_company_id uuid, _url text, _points integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT (public.is_owner_of(_company_id) OR public.is_admin()) THEN RAISE EXCEPTION 'Sem permissão para configurar esta loja.'; END IF;
 PERFORM 1 FROM public.companies WHERE id=_company_id AND active AND plan='premium' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Disponível apenas no plano Premium de uma loja ativa.'; END IF;
 IF _points IS NULL OR _points NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Use de 1 a 10.000 pontos.'; END IF;
 IF NULLIF(btrim(_url),'') IS NOT NULL AND (length(_url)>2048 OR btrim(_url) !~ '^https://(g\.page|maps\.app\.goo\.gl|goo\.gl|([a-z0-9-]+\.)?google\.(com|com\.br))(/|\?|$)') THEN RAISE EXCEPTION 'Digite um link HTTPS válido do Google.'; END IF;
 UPDATE public.companies SET google_review_url=NULLIF(btrim(_url),''), google_review_points=_points WHERE id=_company_id;
END $$;
CREATE OR REPLACE FUNCTION public.responder_pesquisa(_company_id uuid, _rating integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pts integer; balance integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para responder.'; END IF;
 IF _rating IS NULL OR _rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Escolha uma nota de 1 a 5.'; END IF;
 SELECT google_review_points INTO pts FROM public.companies WHERE id=_company_id AND active AND plan='premium' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pesquisa disponível apenas para lojas Premium ativas.'; END IF;
 PERFORM 1 FROM public.memberships WHERE customer_id=auth.uid() AND company_id=_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Você não faz parte do clube desta loja.'; END IF;
 IF EXISTS (SELECT 1 FROM public.satisfaction_responses WHERE company_id=_company_id AND customer_id=auth.uid()) THEN RAISE EXCEPTION 'Você já respondeu à pesquisa desta loja.'; END IF;
 INSERT INTO public.satisfaction_responses(company_id,customer_id,rating,points_awarded) VALUES (_company_id,auth.uid(),_rating,pts);
 balance := public._apply_points(_company_id,auth.uid(),'pesquisa'::public.transaction_type,pts,NULL);
 RETURN balance;
END $$;
REVOKE ALL ON FUNCTION public.salvar_configuracao_pesquisa(uuid,text,integer), public.responder_pesquisa(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_configuracao_pesquisa(uuid,text,integer), public.responder_pesquisa(uuid,integer) TO authenticated;