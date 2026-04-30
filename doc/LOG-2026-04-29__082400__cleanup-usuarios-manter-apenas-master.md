# LOG: limpeza de usuários mantendo apenas master

## Contexto

Solicitada limpeza dos usuários do sistema, preservando somente `master@credilix.local`.

## Ações executadas

- Execução de script local (Node + `@supabase/supabase-js`) usando variáveis do `.env`.
- Identificação do `tenant_id` do usuário master.
- Limpeza de tabelas dependentes do tenant para evitar bloqueios por FK:
  - `commission_tables`
  - `contents`
  - `banks` (quando existir)
  - `products`
- Limpeza de vínculos hierárquicos em `users` (`created_by_user_id`, `leader_user_id`) quando as colunas existem.
- Exclusão dos usuários do tenant com `id != master`.

## Resultado

Contagem antes:

- `users`: 4
- `products`: 2
- `banks`: 0
- `commission_tables`: 0
- `contents`: 0

Contagem depois:

- `users`: 1
- `products`: 0
- `banks`: 0
- `commission_tables`: 0
- `contents`: 0
- `master`: 1

## Segurança

- Operação feita via `SUPABASE_SERVICE_ROLE_KEY` local, sem versionar segredos.
- Script temporário de execução foi removido após a limpeza.

## Palavras-chave

- cleanup usuarios
- manter apenas master
- limpar tenant credilix
