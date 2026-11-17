CREATE OR REPLACE FUNCTION public.admin_excluir_empresa(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente o admin pode excluir empresas.'; END IF;
  PERFORM 1 FROM companies WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
  DELETE FROM redemptions WHERE company_id = _id;
  DELETE FROM transactions WHERE company_id = _id;
  DELETE FROM photo_submissions WHERE company_id = _id;
  DELETE FROM satisfaction_responses WHERE company_id = _id;
  DELETE FROM rewards WHERE company_id = _id;
  DELETE FROM memberships WHERE company_id = _id;
  DELETE FROM user_roles WHERE company_id = _id AND role IN ('dono','funcionario');
  DELETE FROM companies WHERE id = _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_excluir_empresa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_excluir_empresa(uuid) TO authenticated;