# LOG: limpeza de dados para reteste (users + commission_tables)

## Contexto

Solicitado limpar as informações gravadas de usuários e tabelas de comissão para reiniciar os testes.

## Ações executadas

- Executado script Node usando SUPABASE_SERVICE_ROLE_KEY do .env.
- Tenant alvo: Credilix (BOOTSTRAP_TENANT_NAME).
- Tabela commission_tables: removidos todos os registros do tenant.
- Tabela users: removidos todos os usuários do tenant, preservando apenas o MASTER (master@credilix.local) para manter acesso administrativo.

## Resultado

- usersBefore: 4
- usersAfter: 1 (somente master@credilix.local)
- commissionTablesAfterCount: 0

## Segurança

- Operação restrita ao tenant Credilix.
- Credenciais não foram commitadas.

## Palavras-chave

- limpeza users commission tables
- reset dados tenant credilix
