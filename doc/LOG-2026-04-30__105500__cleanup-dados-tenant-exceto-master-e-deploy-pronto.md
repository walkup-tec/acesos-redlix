## Contexto do pedido

Excluir dados operacionais do tenant mantendo apenas o usuário master `master@credilix.local`, removendo:

- Usuários criados (exceto master)
- Tabelas de comissão
- Conteúdos
- Logins banco

E deixar o deploy pronto.

## Ações executadas

1. Atualização do script SQL oficial de limpeza do projeto:
   - `supabase/cleanup-banco-tenant-credilix.sql`
2. Inclusão explícita na limpeza de:
   - `public.commission_table_leader_overrides`
   - `public.bank_login_requests`
3. Ajuste da ordem de deleção para respeitar dependências e manter consistência.
4. Preparação para deploy via commit e push da branch principal.

## Solução implementada

- O script agora remove todo o conjunto de dados solicitado para o tenant Credilix e preserva somente o usuário master por e-mail.
- Foram adicionados contadores (`RAISE NOTICE`) para facilitar auditoria da execução.
- A limpeza permanece transacional (`BEGIN ... COMMIT`) para evitar estado parcial.

## Arquivos alterados

- `supabase/cleanup-banco-tenant-credilix.sql`
- `doc/LOG-2026-04-30__105500__cleanup-dados-tenant-exceto-master-e-deploy-pronto.md`
- `doc/memoria.md`

## Como validar

1. Executar o SQL no Supabase SQL Editor.
2. Confirmar:
   - `users`: apenas `master@credilix.local` no tenant
   - `commission_tables`: 0
   - `commission_table_leader_overrides`: 0
   - `contents`: 0
   - `bank_login_requests`: 0
3. Verificar os `NOTICE` retornados na execução do script.

## Segurança

- Nenhum segredo exposto.
- Limpeza restrita por `tenant_id` resolvido via nome do tenant (`Credilix`).

## Palavras-chave

`cleanup tenant credilix`, `master only`, `commission tables cleanup`, `contents cleanup`, `bank login cleanup`
