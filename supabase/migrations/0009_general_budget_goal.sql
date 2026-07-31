-- Fluxa — schema v9: permite meta de gastos geral (sem categoria nem cartão)
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

alter table public.budget_goals drop constraint budget_goals_target_check;
