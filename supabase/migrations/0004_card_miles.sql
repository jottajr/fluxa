-- Fluxa — schema v4: milhas por cartão de crédito
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

alter table public.payment_methods
  add column miles_ratio_amount numeric(12,2),
  add column miles_ratio_miles numeric(12,2);
