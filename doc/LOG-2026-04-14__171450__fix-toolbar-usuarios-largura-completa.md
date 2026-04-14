# LOG: correção de alinhamento completo no card de usuários

## Contexto

Após ajuste anterior, título, filtro e botão ficaram agrupados à esquerda por falta de expansão total do container no toolbar.

## Correção aplicada

- Arquivo: `web/src/index.css`
- Ajustes:
  - `.users-toolbar` com `width: 100%`;
  - `.users-toolbar__top` com `width: 100%`;
  - `.users-toolbar .card-toolbar__actions` com `margin-left: auto` para manter filtro + atualizar no lado direito.

## Resultado esperado

- Título e busca permanecem na área esquerda.
- Filtro e botão atualizar ficam no lado direito do card.

## Validação

- `npm run build --prefix web` (OK)
- Sem erros de lint.

## Palavras-chave

- users toolbar full width
- filtro direita atualizar direita
- busca esquerda card usuarios
