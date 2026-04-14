# LOG: script SQL — limpeza de banco (tenant Credilix)

## Pedido

Limpar dados de: tabelas de comissão, usuários (exceto `master@credilix.local`), conteúdos, produtos e cadastro de bancos / nomes de tabelas de comissão.

## Solução

Arquivo `supabase/cleanup-banco-tenant-credilix.sql`:

- Escopo por **tenant** `Credilix` (ajustável no `tenant_name` dentro do `DO`).
- Ordem: `commission_tables` → `contents` → `products` → `banks` → `users` (preserva apenas e-mail master no tenant).
- Transação `BEGIN`/`COMMIT` + `RAISE NOTICE` com contagens.

**Storage:** o SQL não remove ficheiros no bucket do Supabase; limpar Storage à parte se for necessário.

## Como executar

Supabase Dashboard → **SQL Editor** → colar o script → **Run** (utilizador com permissão sobre as tabelas; em geral o SQL Editor do projeto ignora RLS como superuser).

## Segurança

- Não commitar `SERVICE_ROLE` nem executar o script em produção sem confirmação explícita.
- Revisar `tenant_name` se o nome do tenant no painel não for `Credilix`.

## Palavras-chave

- cleanup banco credilix commission_tables contents products banks users
- master@credilix.local preservado
