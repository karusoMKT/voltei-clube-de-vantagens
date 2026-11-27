ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state text, ADD COLUMN IF NOT EXISTS referral_points integer NOT NULL DEFAULT 50 CHECK (referral_points BETWEEN 0 AND 10000);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text CHECK (city IS NULL OR length(city) <= 100);

CREATE TABLE public.referral_codes (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, referrer_id)
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver meus códigos" ON public.referral_codes FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR public.is_staff_of(company_id) OR public.is_admin());

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','concluida')),
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (company_id, referred_id),
  CHECK (referrer_id <> referred_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver indicações" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_staff_of(company_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.meu_codigo_indicacao(_company_id uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM memberships WHERE customer_id = auth.uid() AND company_id = _company_id) THEN RAISE EXCEPTION 'Você não participa desta loja.'; END IF;
  SELECT code INTO _code FROM referral_codes WHERE company_id = _company_id AND referrer_id = auth.uid();
  IF _code IS NOT NULL THEN RETURN _code; END IF;
  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    BEGIN
      INSERT INTO referral_codes(company_id, referrer_id, code) VALUES (_company_id, auth.uid(), _code);
      RETURN _code;
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO _code FROM referral_codes WHERE company_id = _company_id AND referrer_id = auth.uid();
      IF _code IS NOT NULL THEN RETURN _code; END IF;
    END;
  END LOOP;
END $$;

-- Convidado aceita o convite: só vale se for novo na loja (sem compras) e não for o próprio indicador.
CREATE OR REPLACE FUNCTION public.aceitar_indicacao(_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rc referral_codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente.'; END IF;
  SELECT * INTO _rc FROM referral_codes WHERE code = upper(btrim(_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido.'; END IF;
  IF _rc.referrer_id = auth.uid() THEN RAISE EXCEPTION 'Você não pode usar seu próprio convite.'; END IF;
  PERFORM 1 FROM companies WHERE id = _rc.company_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Esta loja não está disponível.'; END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE company_id = _rc.company_id AND customer_id = auth.uid() AND type = 'compra') THEN
    RAISE EXCEPTION 'O convite vale só para quem ainda não comprou nesta loja.';
  END IF;
  INSERT INTO memberships(customer_id, company_id, points_balance) VALUES (auth.uid(), _rc.company_id, 0) ON CONFLICT (customer_id, company_id) DO NOTHING;
  INSERT INTO referrals(company_id, referrer_id, referred_id) VALUES (_rc.company_id, _rc.referrer_id, auth.uid()) ON CONFLICT (company_id, referred_id) DO NOTHING;
  RETURN _rc.company_id;
END $$;

-- Paga a indicação na primeira compra válida do convidado.
CREATE OR REPLACE FUNCTION public._pagar_indicacao(_company uuid, _customer uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r referrals%ROWTYPE; _pts integer;
BEGIN
  SELECT * INTO _r FROM referrals WHERE company_id = _company AND referred_id = _customer AND status = 'pendente' FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT referral_points INTO _pts FROM companies WHERE id = _company;
  IF NOT EXISTS (SELECT 1 FROM memberships WHERE customer_id = _r.referrer_id AND company_id = _company) THEN RETURN; END IF;
  UPDATE referrals SET status = 'concluida', points_awarded = coalesce(_pts,0), completed_at = now() WHERE id = _r.id;
  IF coalesce(_pts,0) > 0 THEN
    UPDATE memberships SET points_balance = points_balance + _pts WHERE customer_id = _r.referrer_id AND company_id = _company;
    INSERT INTO transactions(company_id, customer_id, type, points, created_by) VALUES (_company, _r.referrer_id, 'indicacao', _pts, auth.uid());
  END IF;
END $$;
REVOKE ALL ON FUNCTION public._pagar_indicacao(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lancar_compra(_company_id uuid, _customer_id uuid, _valor_em_reais numeric)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE pts integer; novo_saldo integer;
BEGIN
  IF NOT is_staff_of(_company_id) THEN RAISE EXCEPTION 'Você não tem acesso a esta loja.'; END IF;
  IF _valor_em_reais IS NULL OR _valor_em_reais <= 0 THEN RAISE EXCEPTION 'Digite um valor maior que zero.'; END IF;
  IF _valor_em_reais > 5000 THEN RAISE EXCEPTION 'O valor máximo por compra é R$ 5.000.'; END IF;
  PERFORM 1 FROM memberships WHERE customer_id = _customer_id AND company_id = _company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não achamos esse cliente no clube.'; END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE company_id = _company_id AND customer_id = _customer_id
               AND type = 'compra' AND created_at > now() - interval '2 minutes') THEN
    RAISE EXCEPTION 'Essa compra já foi lançada agora há pouco.';
  END IF;
  SELECT floor(_valor_em_reais * points_per_real)::int INTO pts FROM companies WHERE id = _company_id;
  UPDATE memberships SET points_balance = points_balance + pts WHERE customer_id = _customer_id AND company_id = _company_id
    RETURNING points_balance INTO novo_saldo;
  INSERT INTO transactions (company_id, customer_id, type, amount_reais, points, created_by)
    VALUES (_company_id, _customer_id, 'compra', _valor_em_reais, pts, auth.uid());
  PERFORM public._pagar_indicacao(_company_id, _customer_id);
  RETURN novo_saldo;
END $function$;

CREATE OR REPLACE FUNCTION public.admin_definir_estado(_id uuid, _state text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente o admin pode editar empresas.'; END IF;
  IF nullif(btrim(coalesce(_state,'')),'') IS NOT NULL AND upper(btrim(_state)) !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'Estado inválido.'; END IF;
  UPDATE companies SET state = nullif(upper(btrim(coalesce(_state,''))),'') WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
END $$;

DROP FUNCTION IF EXISTS public.lojas_parceiras();
CREATE FUNCTION public.lojas_parceiras()
 RETURNS TABLE(id uuid, name text, slug text, logo_url text, city text, state text, address text, rewards jsonb)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para descobrir lojas.'; END IF;
 RETURN QUERY SELECT c.id,c.name,c.slug,c.logo_url,c.city,c.state,c.address,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',r.name,'cost_points',r.cost_points) ORDER BY r.cost_points)
    FROM (SELECT r2.name,r2.cost_points FROM public.rewards r2 WHERE r2.company_id=c.id AND r2.active ORDER BY r2.cost_points LIMIT 3) r),'[]'::jsonb)
 FROM public.companies c WHERE c.active ORDER BY c.name;
END $function$;

REVOKE ALL ON FUNCTION public.meu_codigo_indicacao(uuid), public.aceitar_indicacao(text), public.admin_definir_estado(uuid, text), public.lojas_parceiras() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.meu_codigo_indicacao(uuid), public.aceitar_indicacao(text), public.admin_definir_estado(uuid, text), public.lojas_parceiras() TO authenticated;