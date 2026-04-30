## Contexto do pedido

Após acesso em produção, o usuário informou que os dados ainda estavam presentes e solicitou limpeza imediata de:

- Usuários criados (manter apenas `master@credilix.local`)
- Tabelas de Comissão
- Conteúdos
- Logins banco

Também pediu para deixar o deploy pronto.

## Ações executadas

1. Execução real da limpeza no banco Supabase (tenant `Credilix`) via script local temporário com `SUPABASE_SERVICE_ROLE_KEY`.
2. Ordem de limpeza aplicada:
   - `commission_table_leader_overrides`
   - `commission_tables`
   - `contents`
   - `bank_login_requests`
   - `products`
   - `banks`
   - `users` (exceto `master@credilix.local`)
3. Validação pós-limpeza com contagens por tabela.
4. Remoção do script temporário local após execução.

## Resultado da execução

- `commission_table_leader_overrides`: `6 -> 0`
- `commission_tables`: `6 -> 0`
- `contents`: `2 -> 0`
- `bank_login_requests`: `2 -> 0`
- `products`: `4 -> 0`
- `banks`: `4 -> 0`
- `users removidos`: `5`
- `users restantes`: apenas `master@credilix.local (MASTER)`

Validação final:

- `commission_table_leader_overrides = 0`
- `commission_tables = 0`
- `contents = 0`
- `bank_login_requests = 0`

## Arquivos alterados

- `doc/LOG-2026-04-30__111300__exec-cleanup-tenant-credilix-apenas-master.md`
- `doc/memoria.md`

## Como validar

1. Acessar a aplicação com `master@credilix.local`.
2. Conferir módulos:
   - Usuários: somente master
   - Tabelas de comissão: vazio
   - Conteúdos: vazio
   - Login banco: vazio
3. Opcional (SQL):
   - `select count(*) from public.commission_tables where tenant_id = '<tenant_id>';`
   - `select count(*) from public.contents where tenant_id = '<tenant_id>';`
   - `select count(*) from public.bank_login_requests where tenant_id = '<tenant_id>';`

## Segurança

- Limpeza executada com chave de serviço local, sem exposição de segredos em repositório.
- Script temporário removido após uso.

## Palavras-chave

`cleanup real supabase`, `tenant credilix`, `master only`, `reset comissao conteudos logins banco`
