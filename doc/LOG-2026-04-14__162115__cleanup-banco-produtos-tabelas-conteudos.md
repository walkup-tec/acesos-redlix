# LOG: limpeza de listas no banco (produtos/tabelas/conteudos)

## Contexto

Solicitada limpeza das listas:
- Produtos: zerar
- Tabelas de comissão: zerar
- Conteúdos: zerar
- Usuários: manter

## Ações executadas

Foi executado script Node com `@supabase/supabase-js` usando variáveis do `.env` para remoção direta nas tabelas:
1. `commission_tables` (primeiro por dependências)
2. `contents`
3. `products`

## Resultado (contagem)

Antes:
- products: 4
- commission_tables: 0
- contents: 9

Depois:
- products: 0
- commission_tables: 0
- contents: 0

## Usuários

Nenhuma ação em `users` (preservados conforme pedido).

## Segurança

- Operação feita via `SUPABASE_SERVICE_ROLE_KEY` local
- Sem exposição de segredos em arquivos versionados

## Palavras-chave

- limpeza banco
- zerar produtos
- zerar tabelas comissao
- zerar conteudos
