# SIG-GCM Brasil — Relatório da Versão Comercial Final

## Módulos consolidados

- Ocorrências Premium
- Central de Comando
- Escalas, Plantões e Permutas

## Validações confirmadas no Supabase

- Segurança comercial: `OK`, 0 falhas em 871 verificações
- Ocorrências Premium: `OK`, 0 falhas
- Auditoria de ocorrências: `OK`, 0 falhas
- Anexos e assinaturas: `OK`, 0 falhas
- PDF e validação por QR Code: `OK`, 0 falhas
- Central de Comando, etapas 1 e 2: `OK`, 0 falhas
- Escalas, Plantões e Permutas: `OK`

## Segurança aplicada

- RLS ativa e forçada nas tabelas comerciais
- isolamento por município
- acesso anônimo bloqueado
- views com `security_invoker`
- Storage privado por município
- auditoria automática e histórico imutável
- assinaturas e documentos protegidos
- Supabase Realtime nas fontes operacionais

## Verificação local

- `npx tsc --noEmit`: concluído sem erros
- `npm run build`: iniciado, mas não terminou dentro do limite de execução do ambiente; não foi registrado erro de compilação antes do limite

## Antes da apresentação

1. Recriar `.env.local` apenas no computador autorizado.
2. Executar `npm install`.
3. Executar `npm run build` localmente.
4. Testar um usuário de cada perfil comercial.
5. Testar usuários vinculados a municípios diferentes.
6. Confirmar geração do PDF e leitura do QR Code.
