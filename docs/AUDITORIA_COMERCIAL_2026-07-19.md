# Auditoria comercial — 19/07/2026

## Entregue nesta revisão

- política RLS dinâmica para todas as tabelas públicas com `municipio_id`;
- isolamento entre municípios baseado em `auth.uid()` e `usuarios.auth_id`;
- bloqueio de usuários inativos;
- acesso global reservado ao perfil DESENVOLVEDOR;
- políticas específicas para `usuarios` e `municipios`;
- revogação de acesso anônimo às tabelas privadas;
- proteção do Supabase Storage por pasta de município;
- auditoria estática para detectar exposição de Service Role e rotas administrativas sem autenticação explícita;
- documentação de aplicação e testes antes da apresentação.

## Validação executada

- TypeScript: aprovado com `npx tsc --noEmit`;
- auditoria estática: nenhum achado crítico;
- build Next.js: iniciou a compilação otimizada sem erro imediato, mas excedeu o tempo disponível do ambiente de validação.

## Pendências encontradas para a próxima revisão

A auditoria estática marcou sete rotas para revisão manual de autenticação administrativa:

- backups automático;
- permissões;
- extração de PDF da SIGIA;
- perguntas da SIGIA;
- análise de recuperação de senha;
- arquivo de recuperação de senha;
- listagem de recuperação de senha.

Esses apontamentos não significam exposição confirmada; indicam que a autenticação pode estar indireta ou ausente e precisa ser validada antes da produção.
