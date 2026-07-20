-- SIG-GCM Brasil — Segurança RLS comercial multi-município
-- Execute no SQL Editor do Supabase com uma conta proprietária do projeto.
-- O script é idempotente e aplica proteção a todas as tabelas públicas com municipio_id.

begin;

create schema if not exists app_security;

create or replace function app_security.usuario_atual()
returns table (
  usuario_id bigint,
  municipio_id bigint,
  perfil text,
  status text,
  auth_id uuid
)
language sql
stable
security definer
set search_path = public, auth, app_security
as $$
  select
    u.id::bigint,
    u.municipio_id::bigint,
    upper(coalesce(u.perfil, ''))::text,
    upper(coalesce(u.status, ''))::text,
    u.auth_id::uuid
  from public.usuarios u
  where u.auth_id = auth.uid()
  limit 1;
$$;

revoke all on function app_security.usuario_atual() from public;
grant execute on function app_security.usuario_atual() to authenticated;

create or replace function app_security.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_security
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.auth_id = auth.uid()
      and upper(coalesce(u.status, '')) in ('ATIVO', 'APROVADO', 'EM_SERVICO', 'EM SERVIÇO')
  );
$$;

revoke all on function app_security.usuario_ativo() from public;
grant execute on function app_security.usuario_ativo() to authenticated;

create or replace function app_security.eh_desenvolvedor()
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_security
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.auth_id = auth.uid()
      and upper(coalesce(u.perfil, '')) = 'DESENVOLVEDOR'
      and upper(coalesce(u.status, '')) in ('ATIVO', 'APROVADO', 'EM_SERVICO', 'EM SERVIÇO')
  );
$$;

revoke all on function app_security.eh_desenvolvedor() from public;
grant execute on function app_security.eh_desenvolvedor() to authenticated;

create or replace function app_security.municipio_permitido(alvo bigint)
returns boolean
language sql
stable
security definer
set search_path = public, auth, app_security
as $$
  select app_security.usuario_ativo()
     and (
       app_security.eh_desenvolvedor()
       or exists (
         select 1
         from public.usuarios u
         where u.auth_id = auth.uid()
           and u.municipio_id::bigint = alvo
       )
     );
$$;

revoke all on function app_security.municipio_permitido(bigint) from public;
grant execute on function app_security.municipio_permitido(bigint) to authenticated;

-- Protege automaticamente toda tabela public que possua municipio_id.
do $$
declare
  r record;
  pol text;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'municipio_id'
      and t.table_type = 'BASE TABLE'
      and c.table_name not in ('usuarios')
    group by c.table_name
  loop
    execute format('alter table public.%I enable row level security', r.table_name);
    execute format('alter table public.%I force row level security', r.table_name);

    pol := 'sig_municipio_select';
    execute format('drop policy if exists %I on public.%I', pol, r.table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (app_security.municipio_permitido(municipio_id::bigint))',
      pol, r.table_name
    );

    pol := 'sig_municipio_insert';
    execute format('drop policy if exists %I on public.%I', pol, r.table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app_security.municipio_permitido(municipio_id::bigint))',
      pol, r.table_name
    );

    pol := 'sig_municipio_update';
    execute format('drop policy if exists %I on public.%I', pol, r.table_name);
    execute format(
      'create policy %I on public.%I for update to authenticated using (app_security.municipio_permitido(municipio_id::bigint)) with check (app_security.municipio_permitido(municipio_id::bigint))',
      pol, r.table_name
    );

    pol := 'sig_municipio_delete';
    execute format('drop policy if exists %I on public.%I', pol, r.table_name);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (app_security.municipio_permitido(municipio_id::bigint))',
      pol, r.table_name
    );
  end loop;
end $$;

-- Usuários: cada usuário lê o próprio cadastro; gestores leem usuários do município;
-- somente perfis administrativos alteram cadastros do mesmo município.
alter table public.usuarios enable row level security;
alter table public.usuarios force row level security;

drop policy if exists sig_usuarios_select on public.usuarios;
create policy sig_usuarios_select on public.usuarios
for select to authenticated
using (
  auth_id = auth.uid()
  or app_security.eh_desenvolvedor()
  or (
    app_security.usuario_ativo()
    and municipio_id = (select u.municipio_id from public.usuarios u where u.auth_id = auth.uid() limit 1)
    and exists (
      select 1 from public.usuarios ator
      where ator.auth_id = auth.uid()
        and upper(coalesce(ator.perfil,'')) in ('ADMIN','COMANDANTE','DIRETOR')
    )
  )
);

drop policy if exists sig_usuarios_update_proprio on public.usuarios;
create policy sig_usuarios_update_proprio on public.usuarios
for update to authenticated
using (auth_id = auth.uid() or app_security.eh_desenvolvedor())
with check (auth_id = auth.uid() or app_security.eh_desenvolvedor());

-- Municípios: usuário ativo vê apenas o seu; desenvolvedor vê todos.
alter table public.municipios enable row level security;
alter table public.municipios force row level security;

drop policy if exists sig_municipios_select on public.municipios;
create policy sig_municipios_select on public.municipios
for select to authenticated
using (
  app_security.eh_desenvolvedor()
  or id::bigint = (select u.municipio_id::bigint from public.usuarios u where u.auth_id = auth.uid() limit 1)
);

-- Impede acesso anônimo a tabelas privadas, mantendo apenas rotas públicas explícitas via backend.
do $$
declare r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('revoke all on table public.%I from anon', r.tablename);
  end loop;
end $$;

commit;

-- DIAGNÓSTICO: tabelas ainda sem RLS após execução.
select n.nspname as schema_name, c.relname as tabela, c.relrowsecurity as rls_ativa, c.relforcerowsecurity as rls_forcada
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;
