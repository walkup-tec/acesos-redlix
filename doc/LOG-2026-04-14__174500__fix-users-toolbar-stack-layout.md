# LOG: correção layout toolbar usuários (stack vertical)

## Causa raiz

O wrapper usava `card-toolbar` junto com `users-toolbar`. A classe `.card-toolbar` aplica `display: flex` em linha, fazendo os dois blocos filhos (`users-toolbar__top` e `users-toolbar__search-row`) ficarem lado a lado em vez de empilhados. Com isso, filtro e botão pareciam colados ao título à esquerda.

## Correção

- Removida a classe `card-toolbar` do container do módulo usuários.
- `.users-toolbar` definido como coluna flex (`flex-direction: column`).
- Primeira linha: `justify-content: space-between` — título à esquerda; `users-toolbar__actions` (select + Atualizar) à direita.
- Segunda linha: campo de pesquisa à esquerda, com `max-width` para não esticar demais.

## Arquivos

- `web/src/App.tsx`
- `web/src/index.css`

## Palavras-chave

- users-toolbar flex column
- card-toolbar conflito layout
- filtro direita atualizar direita
