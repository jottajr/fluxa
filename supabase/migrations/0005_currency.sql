-- Fluxa — schema v5: moeda por lançamento (transações e rendimentos)
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

alter table public.transactions
  add column currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR'));

alter table public.investment_returns
  add column currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR'));
