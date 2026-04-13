# LOG — observação da tabela não aparece (coluna ausente no banco)

## Contexto

Ícone de observação na Tabela de Comissão não aparecia, mesmo com texto informado.

## Diagnóstico

- Consulta direta no Supabase retornou erro:
  - `42703: column commission_tables.observation does not exist`
- Sem a coluna, a aplicação não consegue persistir `observation`, então o frontend sempre recebe vazio e mostra `—`.

## Ação aplicada

- Criada migration:
  - `supabase/migration-2026-04-13-add-commission-observation.sql`
  - SQL:
    - `alter table public.commission_tables add column if not exists observation text;`

## Como finalizar

1. Abrir Supabase SQL Editor.
2. Rodar a migration acima.
3. Recarregar o app e criar/editar uma tabela com observação.
4. Validar ícone `Obs.` com tooltip no hover.

## Palavras-chave

- column commission_tables.observation does not exist
- migration add observation
- tooltip observacao tabela
