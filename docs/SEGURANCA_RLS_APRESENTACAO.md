# Segurança comercial — SIG-GCM Brasil

## Aplicação obrigatória no Supabase

Execute nesta ordem no SQL Editor:

1. `supabase/000_SEGURANCA_RLS_COMERCIAL.sql`
2. `supabase/001_STORAGE_RLS_COMERCIAL.sql`

O primeiro arquivo cria funções seguras baseadas no usuário autenticado, ativa e força RLS em todas as tabelas públicas que possuem `municipio_id`, bloqueia acesso anônimo e aplica regras especiais para `usuarios` e `municipios`.

O segundo protege o Storage pelo primeiro segmento do caminho. Todo upload deve seguir o padrão:

```text
<municipio_id>/<modulo>/<arquivo>
```

Exemplo:

```text
1/ocorrencias/2026/ocorrencia-1045/foto-01.jpg
```

## Validação antes da apresentação

Crie quatro contas de teste: DESENVOLVEDOR, COMANDANTE, GUARDA do município 1 e GUARDA do município 2.

Valide obrigatoriamente:

- GUARDA 1 não visualiza nem altera registros do município 2;
- GUARDA 2 não visualiza nem altera registros do município 1;
- COMANDANTE altera somente registros do próprio município;
- DESENVOLVEDOR acessa os municípios para suporte;
- usuário inativo não acessa dados;
- requisições sem token retornam 401;
- uploads fora da pasta do município são rejeitados;
- nenhuma chave `SUPABASE_SERVICE_ROLE_KEY` aparece no navegador.

## Auditoria estática local

Execute:

```bash
npm run security:audit
```

Achados críticos fazem o comando terminar com erro. Achados altos devem ser revisados antes da venda.

## Regra de produção

A Service Role é permitida somente em código executado no servidor. Ela nunca deve usar prefixo `NEXT_PUBLIC_`, ser enviada ao cliente, aparecer em logs ou ser colocada em ZIP de entrega.
