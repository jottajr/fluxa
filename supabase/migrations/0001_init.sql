-- FinJey — schema inicial
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

create extension if not exists "pgcrypto";

-- ========== profiles ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  currency text not null default 'BRL',
  number_format text not null default 'pt-BR',
  month_start_day smallint not null default 1,
  notify_due_soon boolean not null default true,
  due_soon_days smallint not null default 5,
  notify_overdue boolean not null default true,
  notify_email boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_are_self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

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
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

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
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

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
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

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
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

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
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ========== provisionamento automático no cadastro ==========
-- cria perfil + formas de pagamento genéricas + categorias padrão
-- assim que alguém se cadastra (auth.users recebe uma linha nova)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);

  insert into public.payment_methods (profile_id, kind, name) values
    (new.id, 'dinheiro', 'Dinheiro'),
    (new.id, 'pix', 'Pix'),
    (new.id, 'debito', 'Débito'),
    (new.id, 'boleto', 'Boleto');

  insert into public.categories (profile_id, name, icon) values
    (new.id, 'Moradia', '🏠'),
    (new.id, 'Alimentação', '🍽️'),
    (new.id, 'Transporte', '🚗'),
    (new.id, 'Salário', '💰'),
    (new.id, 'Lazer', '🎮'),
    (new.id, 'Investimentos', '📈');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
