update public.companies set plan = case when plan in ('basic','pro','premium') then plan else 'premium' end;
update public.companies set monthly_fee = case plan when 'basic' then 97 when 'pro' then 147 else 197 end where monthly_fee = 0;
alter table public.companies alter column plan set default 'basic';
alter table public.companies add constraint companies_plan_check check (plan in ('basic','pro','premium'));

create or replace function public.company_plan_allows(_company uuid, _feature text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.companies c where c.id = _company and
    case _feature when 'rewards' then c.plan in ('pro','premium') when 'premium' then c.plan = 'premium' else false end)
$$;
revoke execute on function public.company_plan_allows(uuid, text) from public, anon;
grant execute on function public.company_plan_allows(uuid, text) to authenticated;

create or replace function public.enforce_photo_plan() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.company_plan_allows(new.company_id, 'premium') then
    raise exception 'Pontos por foto fazem parte do plano Premium.';
  end if;
  return new;
end $$;
create trigger photo_plan_check before insert or update on public.photo_submissions
  for each row execute function public.enforce_photo_plan();

create or replace function public.enforce_rewards_plan() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.company_plan_allows(new.company_id, 'rewards') then
    raise exception 'O catálogo de prêmios faz parte do plano Profissional.';
  end if;
  return new;
end $$;
create trigger rewards_plan_check before insert or update on public.rewards
  for each row execute function public.enforce_rewards_plan();

create or replace function public.admin_criar_empresa(_name text, _slug text, _plan text, _monthly_fee numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid;
begin
  if not public.is_admin() then raise exception 'Somente o admin pode criar empresas.'; end if;
  if length(trim(_name)) < 2 or length(trim(_name)) > 80 then raise exception 'Nome inválido.'; end if;
  if _slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(_slug) > 60 then raise exception 'Endereço inválido.'; end if;
  if _plan not in ('basic','pro','premium') then raise exception 'Plano inválido.'; end if;
  if _monthly_fee < 0 or _monthly_fee > 100000 then raise exception 'Mensalidade inválida.'; end if;
  if exists (select 1 from public.companies where slug = _slug) then raise exception 'Esse endereço já está em uso.'; end if;
  insert into public.companies (name, slug, plan, monthly_fee) values (trim(_name), _slug, _plan, _monthly_fee) returning id into _id;
  return _id;
end $$;
revoke execute on function public.admin_criar_empresa(text, text, text, numeric) from public, anon;
grant execute on function public.admin_criar_empresa(text, text, text, numeric) to authenticated;