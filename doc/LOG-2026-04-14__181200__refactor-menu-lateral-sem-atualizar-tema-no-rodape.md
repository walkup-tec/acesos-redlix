# LOG: menu lateral — sem Atualizar; tema junto ao Sair

## Contexto

Ajuste do rail lateral: remover botão global `Atualizar` e posicionar alternância claro/escuro próximo ao botão `Sair`, no rodapé do menu.

## Alterações

- `web/src/App.tsx`
  - Removido bloco intermediário com `Atualizar` (refresh global).
  - Botão de tema (`Claro` / `Escuro`) movido para dentro de `shell-rail__group--footer`, imediatamente acima de `Sair`.
- `web/src/index.css`
  - Rodapé do rail: `flex-shrink: 0` e `gap` ligeiramente ajustado entre tema e sair.

## Observação

- O botão `Atualizar` na página de **Usuários** (tabela) permanece disponível.

## Validação

- `npm run build --prefix web` (OK)

## Palavras-chave

- shell-rail footer tema- remover atualizar menu lateral
