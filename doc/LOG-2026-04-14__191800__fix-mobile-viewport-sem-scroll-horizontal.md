# LOG: fix mobile viewport sem scroll horizontal na página

## Contexto

No painel (mobile, ≤900px), ao arrastar lateralmente a página “andava” (scroll horizontal no documento). O objetivo é usar a largura útil da viewport sem esse deslocamento global; listagens com tabelas largas devem continuar com scroll horizontal **apenas** dentro de `.table-wrap`.

## Ações executadas

- Ajustes em `web/src/index.css`:
  - Em `@media (max-width: 900px)`: `overflow-x: hidden`, `width/max-width: 100%` em `html`, `body`, `#root`, `.app-shell`, `.shell-main`; `overscroll-behavior-x: none` no `body`.
  - `.shell-body`: `min-width: 0` e `max-width: 100%` (evita explosão de largura em flex).
  - `.table-wrap`: `max-width: 100%` (mantém `overflow: auto` para scroll interno das tabelas).
  - Substituição de `100vw` por `100%` em overlays/modais onde o bloco de posicionamento é a viewport (`system-alerts-overlay`, `.content-modal`, `.content-modal--confirm-delete`), reduzindo risco de overflow por `vw`.
  - Drawer `.shell-nav`: `min(88vw, …)` → `min(88%, …)` (largura relativa à viewport sem `vw`).

## Como validar

1. `npm run build` em `web/` (ou `npm run dev` e inspecionar em largura &lt; 901px).
2. Em dispositivo ou DevTools mobile: a página não deve apresentar scroll horizontal ao mover o dedo fora das tabelas.
3. Abrir módulo com tabela (ex.: usuários): arrastar horizontalmente **dentro** da área da tabela deve continuar rolando só o conteúdo da tabela.

## Segurança

- Alteração apenas de CSS; sem segredos ou dados.

## Palavras-chave

- mobile overflow-x hidden viewport
- table-wrap scroll horizontal credilix
- 100vw substituido 100% modal overlay
