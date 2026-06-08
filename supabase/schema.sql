-- =============================================================================
-- Tira-Teima — schema inicial (Supabase / Postgres)
-- Cole no SQL Editor do Supabase e execute.
-- =============================================================================
-- Cobre: perfis de usuário, planos (free/pro), papéis (user/admin), contagem
-- diária de clipes (limite do plano gratuito) e políticas de RLS.
-- Observação LGPD: o CPF é dado pessoal sensível. Coletamos apenas dígitos,
-- com consentimento explícito no cadastro. Acesso restrito por RLS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tabela de perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  cpf        text unique,                       -- somente dígitos (11 chars)
  email      text,
  plan       text not null default 'free' check (plan in ('free', 'pro')),
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Eventos de clipe (para o limite diário do plano gratuito).
-- Os clipes em si seguem locais (IndexedDB) por enquanto; aqui guardamos só
-- um registro por geração, para contar quantos foram feitos no dia.
-- ---------------------------------------------------------------------------
create table if not exists public.clip_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists clip_events_user_day_idx
  on public.clip_events (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Helper: o chamador é admin? (security definer => ignora RLS, evita recursão)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Quantos clipes o usuário atual gerou hoje (fuso America/Sao_Paulo)
-- ---------------------------------------------------------------------------
create or replace function public.clips_today()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from public.clip_events
  where user_id = auth.uid()
    and created_at >= (
      date_trunc('day', (now() at time zone 'America/Sao_Paulo'))
      at time zone 'America/Sao_Paulo'
    );
$$;

-- ---------------------------------------------------------------------------
-- Cria o perfil automaticamente quando um usuário se cadastra.
-- full_name e cpf vêm do metadata enviado no signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, cpf, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Impede usuário comum de alterar o próprio plano/papel (escalonamento).
-- ---------------------------------------------------------------------------
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Só restringe quando há um usuário autenticado (requisição via PostgREST).
  -- auth.uid() nulo => contexto confiável (SQL Editor / service role) => permite,
  -- o que viabiliza promover o primeiro admin pelo SQL Editor.
  if auth.uid() is not null and not public.is_admin() then
    if new.plan is distinct from old.plan or new.role is distinct from old.role then
      raise exception 'Apenas administradores podem alterar plano ou papel.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged on public.profiles;
create trigger protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.clip_events enable row level security;

-- profiles: cada um lê/atualiza o seu; admin lê/atualiza todos.
drop policy if exists "profiles_select_own"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- clip_events: cada um insere/lê os seus; admin lê todos.
drop policy if exists "clip_events_insert_own" on public.clip_events;
drop policy if exists "clip_events_select_own" on public.clip_events;
drop policy if exists "clip_events_select_admin" on public.clip_events;

create policy "clip_events_insert_own" on public.clip_events
  for insert with check (auth.uid() = user_id);

create policy "clip_events_select_own" on public.clip_events
  for select using (auth.uid() = user_id);

create policy "clip_events_select_admin" on public.clip_events
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Solicitações de upgrade para Pro (sem pagamento: admin aprova no painel)
-- ---------------------------------------------------------------------------
create table if not exists public.upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- no máximo uma solicitação pendente por usuário
create unique index if not exists upgrade_requests_one_pending
  on public.upgrade_requests (user_id) where status = 'pending';

alter table public.upgrade_requests enable row level security;

drop policy if exists "upgrade_insert_own"  on public.upgrade_requests;
drop policy if exists "upgrade_select_own"   on public.upgrade_requests;
drop policy if exists "upgrade_select_admin" on public.upgrade_requests;
drop policy if exists "upgrade_update_admin" on public.upgrade_requests;

create policy "upgrade_insert_own" on public.upgrade_requests
  for insert with check (auth.uid() = user_id);

create policy "upgrade_select_own" on public.upgrade_requests
  for select using (auth.uid() = user_id);

create policy "upgrade_select_admin" on public.upgrade_requests
  for select using (public.is_admin());

create policy "upgrade_update_admin" on public.upgrade_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- Depois de criar sua conta no app, promova-se a admin rodando (troque o email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'voce@exemplo.com');
-- =============================================================================
