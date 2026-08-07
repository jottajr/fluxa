-- Guarda as respostas do onboarding obrigatório (5 perguntas) por conta.
-- null = ainda não fez onboarding (é o gatilho que redireciona pra /onboarding).
alter table public.accounts
  add column onboarding_preferences jsonb;
