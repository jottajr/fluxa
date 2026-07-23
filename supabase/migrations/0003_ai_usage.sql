-- Fluxa — schema v3: plano da conta (free/pago) + registro de uso de IA
-- Rode este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

-- ========== accounts.plano ==========
alter table public.accounts
  add column plano text not null default 'free' check (plano in ('free', 'pago'));

-- ========== ai_usage_log (uso e custo estimado de IA por conta) ==========
create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null default 'parse_transaction',
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  estimated_cost_usd numeric(10,6) not null,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_log enable row level security;

create policy "ai_usage_log_owner_select" on public.ai_usage_log
  for select using (account_id = auth.uid());

create policy "ai_usage_log_owner_insert" on public.ai_usage_log
  for insert with check (account_id = auth.uid());

create policy "ai_usage_log_admin_all" on public.ai_usage_log
  for all using ((auth.jwt() ->> 'email') = 'jottamoreirajr@uol.com.br')
  with check ((auth.jwt() ->> 'email') = 'jottamoreirajr@uol.com.br');

create index ai_usage_log_account_created_idx on public.ai_usage_log (account_id, created_at);
