create or replace function public.enforce_rewards_plan() returns trigger language plpgsql security definer set search_path = public as $$
declare _plan text; _count int;
begin
  select plan into _plan from public.companies where id = new.company_id for update;
  if _plan = 'basic' and new.active and (tg_op = 'INSERT' or not old.active) then
    select count(*) into _count from public.rewards where company_id = new.company_id and active and id <> new.id;
    if _count >= 3 then
      raise exception 'O plano Básico permite até 3 prêmios ativos. Faça o upgrade para o plano Profissional.';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.enforce_rewards_plan() from public, anon, authenticated;

create or replace function public.editar_premio(_reward_id uuid, _name text, _cost_reais numeric, _cost_points integer)
returns void language plpgsql security definer set search_path = public as $$
declare company uuid;
begin
  select company_id into company from public.rewards where id = _reward_id;
  if company is null or not (public.is_owner_of(company) or public.is_admin()) then raise exception 'Você não tem acesso a este prêmio.'; end if;
  if _name is null or length(btrim(_name)) not between 1 and 100 then raise exception 'Digite um nome de até 100 letras para o prêmio.'; end if;
  if _cost_reais is null or _cost_reais::text in ('NaN','Infinity','-Infinity') or _cost_reais < 0 or _cost_reais > 99999.99 then raise exception 'Digite um custo entre R$ 0 e R$ 99.999,99.'; end if;
  if _cost_points is null or _cost_points <= 0 or _cost_points > 100000000 then raise exception 'Digite um custo em pontos maior que zero.'; end if;
  update public.rewards set name = btrim(_name), cost_reais = round(_cost_reais,2), cost_points = _cost_points where id = _reward_id;
end $$;
revoke all on function public.editar_premio(uuid,text,numeric,integer) from public, anon;
grant execute on function public.editar_premio(uuid,text,numeric,integer) to authenticated;