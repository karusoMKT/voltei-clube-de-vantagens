DROP FUNCTION IF EXISTS public.salvar_alertas_whatsapp(uuid, boolean, text, integer);
DROP TABLE IF EXISTS public.whatsapp_alert_logs;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_absent_days_chk, DROP CONSTRAINT IF EXISTS companies_alert_phone_chk,
  DROP COLUMN IF EXISTS whatsapp_alerts_enabled, DROP COLUMN IF EXISTS owner_alert_whatsapp, DROP COLUMN IF EXISTS absent_days_threshold;