ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS owner_alert_whatsapp text,
  ADD COLUMN IF NOT EXISTS absent_days_threshold integer NOT NULL DEFAULT 30;
ALTER TABLE public.companies ADD CONSTRAINT companies_absent_days_chk CHECK (absent_days_threshold BETWEEN 7 AND 180);
ALTER TABLE public.companies ADD CONSTRAINT companies_alert_phone_chk CHECK (owner_alert_whatsapp IS NULL OR owner_alert_whatsapp ~ '^\d{10,13}$');

CREATE TABLE public.whatsapp_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('redemption','absent_clients','monthly_summary','test')),
  ref text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','falhou','sem_webhook')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX whatsapp_alert_logs_ref_uniq ON public.whatsapp_alert_logs(company_id, alert_type, ref) WHERE ref IS NOT NULL;
CREATE INDEX whatsapp_alert_logs_company_idx ON public.whatsapp_alert_logs(company_id, created_at DESC);
GRANT SELECT ON public.whatsapp_alert_logs TO authenticated;
GRANT ALL ON public.whatsapp_alert_logs TO service_role;
ALTER TABLE public.whatsapp_alert_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dono e admin leem alertas" ON public.whatsapp_alert_logs FOR SELECT TO authenticated
  USING (public.is_owner_of(company_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.salvar_alertas_whatsapp(_company_id uuid, _enabled boolean, _phone text, _days integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_owner_of(_company_id) OR public.is_admin()) THEN RAISE EXCEPTION 'Sem permissão para esta loja.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = _company_id AND plan = 'premium') THEN RAISE EXCEPTION 'Alertas no WhatsApp são exclusivos do Plano Premium.'; END IF;
  IF _days NOT IN (15, 30, 45) THEN RAISE EXCEPTION 'Escolha 15, 30 ou 45 dias.'; END IF;
  IF _phone IS NOT NULL AND _phone !~ '^\d{10,13}$' THEN RAISE EXCEPTION 'WhatsApp inválido.'; END IF;
  UPDATE companies SET whatsapp_alerts_enabled = _enabled, owner_alert_whatsapp = _phone, absent_days_threshold = _days WHERE id = _company_id;
END $$;
REVOKE ALL ON FUNCTION public.salvar_alertas_whatsapp(uuid, boolean, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.salvar_alertas_whatsapp(uuid, boolean, text, integer) TO authenticated;