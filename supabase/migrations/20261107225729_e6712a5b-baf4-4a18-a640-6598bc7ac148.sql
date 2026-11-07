ALTER TABLE public.companies ADD COLUMN points_photo integer NOT NULL DEFAULT 30;
ALTER TABLE public.photo_submissions ADD COLUMN reviewed_at timestamptz;
UPDATE public.photo_submissions SET reviewed_at = created_at WHERE status <> 'pendente';
CREATE UNIQUE INDEX one_pending_photo_per_customer ON public.photo_submissions(customer_id) WHERE status = 'pendente';

CREATE OR REPLACE FUNCTION public.validate_photo_points() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.points_photo <= 0 THEN RAISE EXCEPTION 'Os pontos por foto devem ser maiores que zero.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_photo_points BEFORE INSERT OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.validate_photo_points();
REVOKE ALL ON FUNCTION public.validate_photo_points() FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.photo_submissions FROM anon, authenticated;
DROP POLICY "cliente envia print" ON public.photo_submissions;
DROP POLICY "cliente envia print no bucket" ON storage.objects;
DROP POLICY "ver prints no bucket" ON storage.objects;
CREATE POLICY "prints somente cliente e equipe" ON storage.objects FOR SELECT TO authenticated USING (
 bucket_id = 'prints' AND (
 (public.is_customer() AND split_part(name, '/', 2) = auth.uid()::text AND EXISTS (
 SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id::text = split_part(name, '/', 1)))
 OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('funcionario','dono') AND r.company_id::text = split_part(name, '/', 1))
 ));
REVOKE EXECUTE ON FUNCTION public.revisar_print(uuid, boolean, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enviar_foto(_company_id uuid, _image_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE submission_id uuid; handle text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_customer() THEN RAISE EXCEPTION 'Entre como cliente para enviar seu print.'; END IF;
 PERFORM 1 FROM public.memberships WHERE customer_id = auth.uid() AND company_id = _company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Você ainda não faz parte do clube desta loja.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND active) THEN RAISE EXCEPTION 'Esta loja não está recebendo prints agora.'; END IF;
 IF EXISTS (SELECT 1 FROM public.photo_submissions WHERE customer_id = auth.uid() AND status = 'pendente') THEN RAISE EXCEPTION 'Você já tem um print aguardando aprovação.'; END IF;
 IF EXISTS (SELECT 1 FROM public.photo_submissions WHERE customer_id = auth.uid() AND company_id = _company_id AND status = 'aprovada' AND (reviewed_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date) THEN RAISE EXCEPTION 'Você já ganhou pontos por foto nesta loja hoje. Volte amanhã!'; END IF;
 IF _image_path IS NULL OR split_part(_image_path, '/', 1) <> _company_id::text OR split_part(_image_path, '/', 2) <> auth.uid()::text OR _image_path !~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+\.(jpg|png|webp)$' THEN RAISE EXCEPTION 'Não conseguimos conferir este print. Envie novamente.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'prints' AND name = _image_path) THEN RAISE EXCEPTION 'O print ainda não foi enviado. Tente novamente.'; END IF;
 SELECT instagram INTO handle FROM public.profiles WHERE id = auth.uid();
 INSERT INTO public.photo_submissions(company_id, customer_id, image_path, instagram_handle, status) VALUES (_company_id, auth.uid(), _image_path, handle, 'pendente') RETURNING id INTO submission_id;
 RETURN submission_id;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Você já tem um print aguardando aprovação.';
END $$;

CREATE OR REPLACE FUNCTION public.aprovar_foto(_submission_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.photo_submissions; pts integer; balance integer;
BEGIN
 SELECT * INTO s FROM public.photo_submissions WHERE id = _submission_id;
 IF s.id IS NULL OR NOT public.is_staff_of(s.company_id) THEN RAISE EXCEPTION 'Você não tem acesso a este print.'; END IF;
 PERFORM 1 FROM public.memberships WHERE customer_id = s.customer_id AND company_id = s.company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Não achamos esse cliente no clube.'; END IF;
 SELECT * INTO s FROM public.photo_submissions WHERE id = _submission_id FOR UPDATE;
 IF s.status <> 'pendente' THEN RAISE EXCEPTION 'Esse print já foi analisado.'; END IF;
 IF EXISTS (SELECT 1 FROM public.photo_submissions WHERE customer_id = s.customer_id AND company_id = s.company_id AND status = 'aprovada' AND (reviewed_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date) THEN RAISE EXCEPTION 'Este cliente já ganhou pontos por foto nesta loja hoje.'; END IF;
 SELECT points_photo INTO pts FROM public.companies WHERE id = s.company_id;
 balance := public._apply_points(s.company_id, s.customer_id, 'foto', pts, NULL);
 UPDATE public.photo_submissions SET status = 'aprovada', reviewed_by = auth.uid(), reviewed_at = now() WHERE id = s.id;
 RETURN balance;
END $$;

CREATE OR REPLACE FUNCTION public.recusar_foto(_submission_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.photo_submissions;
BEGIN
 SELECT * INTO s FROM public.photo_submissions WHERE id = _submission_id FOR UPDATE;
 IF s.id IS NULL OR NOT public.is_staff_of(s.company_id) THEN RAISE EXCEPTION 'Você não tem acesso a este print.'; END IF;
 IF s.status <> 'pendente' THEN RAISE EXCEPTION 'Esse print já foi analisado.'; END IF;
 UPDATE public.photo_submissions SET status = 'recusada', reviewed_by = auth.uid(), reviewed_at = now() WHERE id = s.id;
END $$;

CREATE OR REPLACE FUNCTION public.lancar_pontos(_company uuid, _customer uuid, _type public.transaction_type, _points integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT (public.is_staff_of(_company) OR public.is_admin()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _type = 'foto' THEN RAISE EXCEPTION 'Use a aprovação do print para dar pontos por foto.'; END IF;
 IF _type NOT IN ('google','indicacao','ajuste') THEN RAISE EXCEPTION 'Tipo inválido'; END IF;
 RETURN public._apply_points(_company, _customer, _type, _points, NULL);
END $$;
REVOKE ALL ON FUNCTION public.enviar_foto(uuid, text), public.aprovar_foto(uuid), public.recusar_foto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enviar_foto(uuid, text), public.aprovar_foto(uuid), public.recusar_foto(uuid) TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'photo_submissions') THEN
 ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_submissions;
 END IF;
END $$;