# LOG — Tabela de Comissão: card sem título e layout mais compacto

## Contexto

No formulário de criação de tabela (módulo **Tabela de Comissão**), o utilizador pediu remover o título **Criação de Tabela** do card, subir os campos e reduzir a altura do botão **Incluir**.

## Ações

- `web/src/App.tsx`: removido `<h3>Criação de Tabela</h3>`; adicionada classe `commission-table-create-form` ao `<form>`; `row` alterado de `g-2` para `gx-2 gy-1` (gutters mais apertados na vertical).
- `web/src/index.css`: estilos para `.commission-table-create-form` — menos `gap` no grid do formulário, `padding-top`/`padding-bottom` do card ligeiramente reduzidos, `row-gap` na linha de campos; `button[type="submit"]` com `padding` e `font-size` menores, `min-height: auto`.

## Ficheiros alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.

## Palavras-chave

- tabela comissão formulário card
- commission-table-create-form
- botão incluir altura
