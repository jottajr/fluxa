-- Fluxa — schema v6: posições de investimento com projeção automática
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

create table public.investment_positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  contribution_date date not null,
  category text not null check (category in ('renda_fixa', 'renda_variavel', 'outro')),
  rate_value numeric(8,4),
  rate_unit text check (rate_unit in ('mensal', 'anual')),
  note text,
  created_at timestamptz not null default now(),
  constraint investment_positions_rate_only_renda_fixa check (
    category = 'renda_fixa' or (rate_value is null and rate_unit is null)
  )
);

alter table public.investment_positions enable row level security;

create policy "investment_positions_owner" on public.investment_positions
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

create index investment_positions_profile_date_idx
  on public.investment_positions (profile_id, contribution_date);
