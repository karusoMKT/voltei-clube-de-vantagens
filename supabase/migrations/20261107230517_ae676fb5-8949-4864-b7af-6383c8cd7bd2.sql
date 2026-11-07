REVOKE UPDATE ON public.companies FROM authenticated;
REVOKE INSERT, UPDATE ON public.rewards FROM authenticated;
CREATE OR REPLACE FUNCTION public.salvar_regra_pontos(_company_id uuid, _points_per_real numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.is_staff_of(_company_id) THEN RAISE EXCEPTION 'Você não tem acesso a esta loja.'; END IF;
 IF _points_per_real IS NULL OR _points_per_real::text IN ('NaN','Infinity','-Infinity') OR _points_per_real <= 0 OR _points_per_real > 1000 THEN RAISE EXCEPTION 'Digite uma regra de pontos maior que zero e até 1.000.'; END IF;
 UPDATE public.companies SET points_per_real = _points_per_real WHERE id = _company_id;
END $$;
CREATE OR REPLACE FUNCTION public.criar_premio(_company_id uuid, _name text, _cost_reais numeric, _cost_points integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reward_id uuid;
BEGIN
 IF NOT public.is_staff_of(_company_id) THEN RAISE EXCEPTION 'Você não tem acesso a esta loja.'; END IF;
 IF _name IS NULL OR length(btrim(_name)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Digite um nome de até 100 letras para o prêmio.'; END IF;
 IF _cost_reais IS NULL OR _cost_reais::text IN ('NaN','Infinity','-Infinity') OR _cost_reais < 0 OR _cost_reais > 99999.99 THEN RAISE EXCEPTION 'Digite um custo entre R$ 0 e R$ 99.999,99.'; END IF;
 IF _cost_points IS NULL OR _cost_points <= 0 OR _cost_points > 100000000 THEN RAISE EXCEPTION 'Digite um custo em pontos maior que zero.'; END IF;
 INSERT INTO public.rewards(company_id,name,cost_reais,cost_points,active) VALUES (_company_id,btrim(_name),round(_cost_reais,2),_cost_points,true) RETURNING id INTO reward_id;
 RETURN reward_id;
END $$;
CREATE OR REPLACE FUNCTION public.ativar_premio(_reward_id uuid, _active boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE company uuid;
BEGIN
 SELECT company_id INTO company FROM public.rewards WHERE id = _reward_id;
 IF company IS NULL OR NOT public.is_staff_of(company) THEN RAISE EXCEPTION 'Você não tem acesso a este prêmio.'; END IF;
 IF _active IS NULL THEN RAISE EXCEPTION 'Escolha se o prêmio está ativo.'; END IF;
 UPDATE public.rewards SET active = _active WHERE id = _reward_id;
END $$;
REVOKE ALL ON FUNCTION public.salvar_regra_pontos(uuid,numeric),public.criar_premio(uuid,text,numeric,integer),public.ativar_premio(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_regra_pontos(uuid,numeric),public.criar_premio(uuid,text,numeric,integer),public.ativar_premio(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.resumo_empresa(_company_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE month_start timestamptz; month_end timestamptz; result jsonb;
BEGIN
 IF NOT public.is_staff_of(_company_id) THEN RAISE EXCEPTION 'Você não tem acesso a esta loja.'; END IF;
 month_start := date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
 month_end := (date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo') + interval '1 month') AT TIME ZONE 'America/Sao_Paulo';
 SELECT jsonb_build_object(
 'month',to_char(now() AT TIME ZONE 'America/Sao_Paulo','YYYY-MM'),
 'customers',(SELECT count(*) FROM public.memberships WHERE company_id=_company_id),
 'purchases',(SELECT count(*) FROM public.transactions WHERE company_id=_company_id AND type='compra' AND created_at>=month_start AND created_at<month_end),
 'points',(SELECT coalesce(sum(points),0) FROM public.transactions WHERE company_id=_company_id AND points>0 AND created_at>=month_start AND created_at<month_end),
 'redemptions',(SELECT count(*) FROM public.redemptions WHERE company_id=_company_id AND created_at>=month_start AND created_at<month_end),
 'inactive',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.customer_id,'name',x.full_name,'phone',x.phone,'balance',x.points_balance,'lastPurchase',x.last_purchase) ORDER BY coalesce(x.last_purchase,x.joined)) FROM (
 SELECT m.customer_id,p.full_name,p.phone,m.points_balance,m.created_at AS joined,max(t.created_at) AS last_purchase
 FROM public.memberships m JOIN public.profiles p ON p.id=m.customer_id
 LEFT JOIN public.transactions t ON t.customer_id=m.customer_id AND t.company_id=m.company_id AND t.type='compra'
 WHERE m.company_id=_company_id GROUP BY m.customer_id,p.full_name,p.phone,m.points_balance,m.created_at
 HAVING coalesce(max(t.created_at),m.created_at)<now()-interval '30 days'
 ) x),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.resumo_empresa(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resumo_empresa(uuid) TO authenticated;