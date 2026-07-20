-- SIG-GCM Brasil — Storage isolado por município
-- Padrão obrigatório de caminho: <municipio_id>/<modulo>/<arquivo>

begin;

alter table storage.objects enable row level security;

-- Leitura de arquivos do próprio município.
drop policy if exists sig_storage_select_municipio on storage.objects;
create policy sig_storage_select_municipio on storage.objects
for select to authenticated
using (
  app_security.eh_desenvolvedor()
  or app_security.municipio_permitido(
    case when (storage.foldername(name))[1] ~ '^[0-9]+$'
      then ((storage.foldername(name))[1])::bigint
      else null
    end
  )
);

-- Upload somente na pasta do município do usuário.
drop policy if exists sig_storage_insert_municipio on storage.objects;
create policy sig_storage_insert_municipio on storage.objects
for insert to authenticated
with check (
  app_security.eh_desenvolvedor()
  or app_security.municipio_permitido(
    case when (storage.foldername(name))[1] ~ '^[0-9]+$'
      then ((storage.foldername(name))[1])::bigint
      else null
    end
  )
);

-- Atualização e exclusão seguem a mesma regra.
drop policy if exists sig_storage_update_municipio on storage.objects;
create policy sig_storage_update_municipio on storage.objects
for update to authenticated
using (
  app_security.eh_desenvolvedor()
  or app_security.municipio_permitido(
    case when (storage.foldername(name))[1] ~ '^[0-9]+$'
      then ((storage.foldername(name))[1])::bigint
      else null
    end
  )
)
with check (
  app_security.eh_desenvolvedor()
  or app_security.municipio_permitido(
    case when (storage.foldername(name))[1] ~ '^[0-9]+$'
      then ((storage.foldername(name))[1])::bigint
      else null
    end
  )
);

drop policy if exists sig_storage_delete_municipio on storage.objects;
create policy sig_storage_delete_municipio on storage.objects
for delete to authenticated
using (
  app_security.eh_desenvolvedor()
  or app_security.municipio_permitido(
    case when (storage.foldername(name))[1] ~ '^[0-9]+$'
      then ((storage.foldername(name))[1])::bigint
      else null
    end
  )
);

commit;
