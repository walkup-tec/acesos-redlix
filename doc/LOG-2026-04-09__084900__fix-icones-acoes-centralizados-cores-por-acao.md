# LOG — Usuários: centralização de ícones e paleta por ação

## Contexto

Solicitado:

- centralizar melhor os ícones dos botões de ação;
- manter Editar na cor atual;
- Reset em azul/roxo;
- Inativar em amarelo;
- Bloquear mantendo cor atual.

## Ajustes aplicados

- `web/src/App.tsx`
  - Botão Editar recebeu classe dedicada `user-inline-btn--edit`.
  - Botão Reset recebeu classe dedicada `user-inline-btn--reset`.

- `web/src/index.css`
  - Centralização dos ícones reforçada com `inline-flex`, `align-items: center`, `justify-content: center`, `line-height: 1` e `svg { display: block }`.
  - Cores por ação:
    - Editar: cor atual/padrão.
    - Reset: azul (`rgba(59,130,246,...)` / `#2563eb`), inclusive variante dark.
    - Inativar: amarelo (`rgba(234,179,8,...)`), inclusive variante dark.
    - Bloquear: mantida cor atual (vermelho/alerta já existente).

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Sem erros de lint nos arquivos alterados.

## Palavras-chave

- user icons centered
- reset blue inactive yellow
- users action button color map
