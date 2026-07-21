-- Fluxa — schema v2: múltiplos perfis (CPF/CNPJ) por conta
-- Recria o banco do zero (não há dados reais a preservar, só a conta de teste).
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

-- ========== limpeza (schema anterior) ==========
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists transactions_status_history on public.transactions;
drop function if exists public.handle_new_user();
drop function if exists public.log_status_change();
drop table if exists public.status_history cascade;
drop table if exists public.investment_returns cascade;
drop table if exists public.transactions cascade;
drop table if exists public.payment_methods cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;

create extension if not exists "pgcrypto";

-- ========== accounts (1 por login) ==========
create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  accent_color text not null default 'teal',
  currency text not null default 'BRL',
  number_format text not null default 'pt-BR',
  month_start_day smallint not null default 1,
  notify_due_soon boolean not null default true,
  due_soon_days smallint not null default 5,
  notify_overdue boolean not null default true,
  notify_email boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts_are_self" on public.accounts
  for all using (id = auth.uid()) with check (id = auth.uid());

-- ========== profiles (vários por account: Pessoal/CPF, Estúdio/CNPJ...) ==========
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  type text not null check (type in ('pessoal', 'empresarial')),
  document text,
  icon text not null default '👤',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner" on public.profiles
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ========== categories ==========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default '🏷️',
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_owner" on public.categories
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

-- ========== payment_methods ==========
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('cartao','dinheiro','pix','debito','boleto')),
  name text not null,
  bank text,
  card_type text check (card_type in ('credito','debito','ambos')),
  closing_day smallint,
  due_day smallint,
  credit_limit numeric(12,2),
  color text,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "payment_methods_owner" on public.payment_methods
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

-- ========== transactions ==========
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  date date not null,
  status text not null check (status in ('pendente','pago','agendado','atrasado')),
  type text not null check (type in ('entrada','saida')),
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  recurring boolean not null default false,
  note text,
  installment_group_id uuid,
  installment_number smallint,
  total_installments smallint,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions_owner" on public.transactions
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

create index transactions_profile_date_idx on public.transactions (profile_id, date);

-- ========== status_history ==========
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now()
);

alter table public.status_history enable row level security;

create policy "status_history_owner" on public.status_history
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

-- grava automaticamente sempre que o status de uma transação muda
create function public.log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.status_history (transaction_id, profile_id, old_status, new_status)
    values (new.id, new.profile_id, old.status, new.status);
  elsif (tg_op = 'INSERT') then
    insert into public.status_history (transaction_id, profile_id, old_status, new_status)
    values (new.id, new.profile_id, null, new.status);
  end if;
  return new;
end;
$$;

create trigger transactions_status_history
after insert or update on public.transactions
for each row execute function public.log_status_change();

-- ========== investment_returns ==========
create table public.investment_returns (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.investment_returns enable row level security;

create policy "investment_returns_owner" on public.investment_returns
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

-- ========== budget_goals (meta mensal por categoria e/ou por cartão) ==========
create table public.budget_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  payment_method_id uuid references public.payment_methods(id) on delete cascade,
  monthly_limit numeric(12,2) not null,
  created_at timestamptz not null default now(),
  constraint budget_goals_target_check check (
    category_id is not null or payment_method_id is not null
  )
);

alter table public.budget_goals enable row level security;

create policy "budget_goals_owner" on public.budget_goals
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

-- ========== feedback (caixa privada: usuário envia, só o dono do produto lê tudo) ==========
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('dica','erro','sugestao')),
  message text not null,
  status text not null default 'novo' check (status in ('novo','em_analise','resolvido')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "feedback_owner_insert" on public.feedback
  for insert with check (account_id = auth.uid());

create policy "feedback_owner_select" on public.feedback
  for select using (account_id = auth.uid());

create policy "feedback_admin_all" on public.feedback
  for all using ((auth.jwt() ->> 'email') = 'jottamoreirajr@uol.com.br')
  with check ((auth.jwt() ->> 'email') = 'jottamoreirajr@uol.com.br');

-- ========== provisionamento automático no cadastro ==========
-- cria account + perfil "Pessoal" padrão + formas de pagamento genéricas
-- + categorias padrão assim que alguém se cadastra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_profile_id uuid;
begin
  insert into public.accounts (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);

  insert into public.profiles (account_id, name, type)
  values (new.id, 'Pessoal', 'pessoal')
  returning id into new_profile_id;

  insert into public.payment_methods (profile_id, kind, name) values
    (new_profile_id, 'dinheiro', 'Dinheiro'),
    (new_profile_id, 'pix', 'Pix'),
    (new_profile_id, 'debito', 'Débito'),
    (new_profile_id, 'boleto', 'Boleto');

  insert into public.categories (profile_id, name, icon) values
    (new_profile_id, 'Moradia', '🏠'),
    (new_profile_id, 'Alimentação', '🍽️'),
    (new_profile_id, 'Transporte', '🚗'),
    (new_profile_id, 'Salário', '💰'),
    (new_profile_id, 'Lazer', '🎮'),
    (new_profile_id, 'Investimentos', '📈');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
