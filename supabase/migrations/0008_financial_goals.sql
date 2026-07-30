-- Fluxa — schema v8: metas e objetivos financeiros (poupança com valor-alvo e prazo)
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default '🎯',
  target_amount numeric(12,2) not null,
  target_date date,
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.financial_goals enable row level security;

create policy "financial_goals_owner" on public.financial_goals
  for all using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));

create table public.financial_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.financial_goal_contributions enable row level security;

create policy "financial_goal_contributions_owner" on public.financial_goal_contributions
  for all using (goal_id in (
    select id from public.financial_goals
    where profile_id in (select id from public.profiles where account_id = auth.uid())
  ))
  with check (goal_id in (
    select id from public.financial_goals
    where profile_id in (select id from public.profiles where account_id = auth.uid())
  ));

create index financial_goal_contributions_goal_date_idx
  on public.financial_goal_contributions (goal_id, date);
