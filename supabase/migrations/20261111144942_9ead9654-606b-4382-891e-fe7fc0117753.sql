DO $mig$
DECLARE f text;
BEGIN
  FOR f IN SELECT pg_get_functiondef(oid) FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN ('criar_premio','ativar_premio','salvar_regra_pontos','resumo_empresa')
  LOOP
    EXECUTE replace(replace(f,
      'NOT public.is_staff_of(_company_id)', 'NOT (public.is_owner_of(_company_id) OR public.is_admin())'),
      'NOT public.is_staff_of(company)', 'NOT (public.is_owner_of(company) OR public.is_admin())');
  END LOOP;
END $mig$;