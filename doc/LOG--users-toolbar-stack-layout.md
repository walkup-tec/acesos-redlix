# LOG: correção layout toolbar usuários (coluna vs linha)

## Causa raiz

O container usava as classes card-toolbar users-toolbar. .card-toolbar aplica display: flex em linha, fazendo users-toolbar__top e users-toolbar__search-row ficarem lado a lado em vez de empilhados — tudo parecia agrupado à esquerda.

## Correção

- Removida classe card-toolbar do wrapper do módulo usuários.
- .users-toolbar passa a ser coluna flex (lex-direction: column).
- Primeira linha: justify-content: space-between com título à esquerda e bloco users-toolbar__actions (filtro + atualizar) à direita.
- Segunda linha: busca alinhada à esquerda, largura limitada por max-width.

## Arquivos

- web/src/App.tsx
- web/src/index.css

## Palavras-chave

- users-toolbar flex column
- card-toolbar conflito layout
