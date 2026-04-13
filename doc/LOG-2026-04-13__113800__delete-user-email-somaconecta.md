# LOG — exclusão de usuário por e-mail (somaconecta@gmail.com)

## Contexto

Usuário solicitou remover `somaconecta@gmail.com` do banco para recriar o usuário por convite.

## Ações executadas

1. Conexão no Supabase usando variáveis do `D:\Credilix-acessos\.env`.
2. Consulta prévia em `public.users` por e-mail (`ilike`).
3. Exclusão do registro por e-mail.
4. Verificação pós-exclusão.

## Resultado

- `before_count=1`
- `after_count=0`
- E-mail removido com sucesso.

## Segurança

- Nenhuma chave/segredo foi exposto.
- Operação executada com `SERVICE_ROLE` local.

## Palavras-chave

- delete user by email
- somaconecta gmail
- recriar convite usuario
