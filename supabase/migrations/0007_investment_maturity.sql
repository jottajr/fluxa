-- Fluxa — schema v7: vencimento opcional de investimentos
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

alter table public.investment_positions
  add column maturity_date date;
