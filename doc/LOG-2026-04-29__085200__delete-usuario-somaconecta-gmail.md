# LOG: exclusão de usuário por e-mail (somaconecta@gmail.com)

## Contexto

Solicitada a exclusão do usuário `somaconecta@gmail.com`.

## Ações executadas

- Execução de script temporário local com `@supabase/supabase-js` usando `.env`.
- Consulta antes da exclusão.
- `delete` em `public.users` por e-mail (case-insensitive).
- Consulta de validação após a exclusão.
- Remoção do script temporário.

## Resultado

- `beforeCount`: 1
- `afterCount`: 0

Usuário removido com sucesso.

## Segurança

- Operação realizada com `SUPABASE_SERVICE_ROLE_KEY` local.
- Nenhum segredo versionado.

## Palavras-chave

- delete user email
- somaconecta gmail
- supabase users cleanup
