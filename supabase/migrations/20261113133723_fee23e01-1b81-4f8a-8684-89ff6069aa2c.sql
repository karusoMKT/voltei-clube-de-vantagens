REVOKE ALL ON public.satisfaction_responses FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.satisfaction_responses FROM authenticated;
GRANT SELECT ON public.satisfaction_responses TO authenticated;
GRANT ALL ON public.satisfaction_responses TO service_role;
ALTER TABLE public.satisfaction_responses ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.company_plan_allows(uuid,text)
  FROM PUBLIC, anon, authenticated;

DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', f.signature);
  END LOOP;
END $$;