CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'cliente',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
INSERT INTO public.user_roles(user_id, role, company_id)
SELECT id, role, company_id FROM public.profiles;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') $$;
CREATE OR REPLACE FUNCTION public.is_staff_of(_company uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('funcionario','dono') AND company_id = _company) $$;
CREATE OR REPLACE FUNCTION public.is_owner_of(_company uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'dono' AND company_id = _company) $$;
CREATE OR REPLACE FUNCTION public.is_customer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'cliente') $$;
CREATE POLICY "ler cargos" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin() OR public.is_staff_of(company_id));
CREATE OR REPLACE FUNCTION public.touch_user_role() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER touch_user_role BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.touch_user_role();
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name'); INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'cliente'); RETURN NEW; END $$;
REVOKE ALL ON public.memberships, public.transactions, public.redemptions, public.profiles, public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.memberships, public.transactions, public.redemptions, public.profiles, public.user_roles TO authenticated;
GRANT UPDATE(full_name, phone, instagram) ON public.profiles TO authenticated;
GRANT ALL ON public.memberships, public.transactions, public.redemptions, public.profiles, public.user_roles TO service_role;
REVOKE ALL ON public.companies, public.rewards, public.photo_submissions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.companies, public.rewards TO authenticated;
GRANT SELECT, INSERT ON public.photo_submissions TO authenticated;
GRANT ALL ON public.companies, public.rewards, public.photo_submissions TO service_role;
DROP POLICY "cliente entra no clube" ON public.memberships;
DROP POLICY "ver empresas" ON public.companies;
CREATE POLICY "ver empresas" ON public.companies FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(id) OR (public.is_customer() AND active AND EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id = companies.id)));
DROP POLICY "ver prêmios" ON public.rewards;
CREATE POLICY "ver prêmios" ON public.rewards FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(company_id) OR (public.is_customer() AND active AND EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id = rewards.company_id)));
DROP POLICY "ver participações" ON public.memberships;
CREATE POLICY "ver participações" ON public.memberships FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(company_id) OR (public.is_customer() AND customer_id = auth.uid()));
DROP POLICY "ver transações" ON public.transactions;
CREATE POLICY "ver transações" ON public.transactions FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(company_id) OR (public.is_customer() AND customer_id = auth.uid()));
DROP POLICY "ver resgates" ON public.redemptions;
CREATE POLICY "ver resgates" ON public.redemptions FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(company_id) OR (public.is_customer() AND customer_id = auth.uid()));
DROP POLICY "ver prints" ON public.photo_submissions;
CREATE POLICY "ver prints" ON public.photo_submissions FOR SELECT TO authenticated USING (public.is_admin() OR public.is_staff_of(company_id) OR (public.is_customer() AND customer_id = auth.uid()));
DROP POLICY "ver perfil" ON public.profiles;
CREATE POLICY "ver perfil" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = profiles.id AND public.is_staff_of(m.company_id)) OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = profiles.id AND public.is_staff_of(r.company_id)));
ALTER TABLE public.profiles DROP COLUMN role, DROP COLUMN company_id;
DROP POLICY "cliente envia print" ON public.photo_submissions;
CREATE POLICY "cliente envia print" ON public.photo_submissions FOR INSERT TO authenticated WITH CHECK (public.is_customer() AND customer_id = auth.uid() AND status = 'pendente' AND reviewed_by IS NULL AND split_part(image_path, '/', 1) = company_id::text AND split_part(image_path, '/', 2) = auth.uid()::text AND EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id = photo_submissions.company_id));
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.touch_user_role(), public._apply_points(uuid, uuid, public.transaction_type, integer, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(), public.is_customer(), public.is_staff_of(uuid), public.is_owner_of(uuid), public.buscar_cliente_por_telefone(uuid, text), public.lancar_compra(uuid, uuid, numeric), public.resgatar_premio(uuid), public.entregar_resgate(uuid), public.lancar_pontos(uuid, uuid, public.transaction_type, integer), public.revisar_print(uuid, boolean, integer) TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
CREATE OR REPLACE FUNCTION public.resgatar_premio(_reward_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rewards; saldo integer; codigo text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para resgatar.'; END IF;
 IF NOT public.is_customer() THEN RAISE EXCEPTION 'Só clientes podem resgatar prêmios.'; END IF;
 SELECT * INTO r FROM public.rewards WHERE id = _reward_id;
 IF r.id IS NULL OR NOT r.active OR r.cost_points <= 0 THEN RAISE EXCEPTION 'Esse prêmio não está disponível agora.'; END IF;
 SELECT points_balance INTO saldo FROM public.memberships WHERE customer_id = auth.uid() AND company_id = r.company_id FOR UPDATE;
 IF saldo IS NULL THEN RAISE EXCEPTION 'Você ainda não faz parte do clube desta loja.'; END IF;
 IF saldo < r.cost_points THEN RAISE EXCEPTION 'Faltam % pontos para esse prêmio.', r.cost_points - saldo; END IF;
 LOOP
 codigo := lpad(floor(random() * 10000)::int::text, 4, '0');
 EXIT WHEN NOT EXISTS (SELECT 1 FROM public.redemptions WHERE company_id = r.company_id AND status = 'pendente' AND code = codigo);
 END LOOP;
 UPDATE public.memberships SET points_balance = points_balance - r.cost_points WHERE customer_id = auth.uid() AND company_id = r.company_id;
 INSERT INTO public.transactions(company_id, customer_id, type, points, created_by) VALUES (r.company_id, auth.uid(), 'resgate', -r.cost_points, auth.uid());
 INSERT INTO public.redemptions(company_id, customer_id, reward_id, code) VALUES (r.company_id, auth.uid(), r.id, codigo);
 RETURN codigo;
END $$;
DROP POLICY "ver prints no bucket" ON storage.objects;
DROP POLICY "cliente envia print no bucket" ON storage.objects;
CREATE POLICY "ver prints no bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prints' AND (public.is_admin() OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('funcionario','dono') AND r.company_id::text = split_part(name, '/', 1)) OR (public.is_customer() AND split_part(name, '/', 2) = auth.uid()::text AND EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id::text = split_part(name, '/', 1)))));
CREATE POLICY "cliente envia print no bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prints' AND public.is_customer() AND split_part(name, '/', 2) = auth.uid()::text AND EXISTS (SELECT 1 FROM public.memberships m WHERE m.customer_id = auth.uid() AND m.company_id::text = split_part(name, '/', 1)));