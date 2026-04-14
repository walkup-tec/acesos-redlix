# LOG: Usuários — toolbar mobile em coluna (título → Atualizar → filtro → pesquisa)

## Contexto

Somente em **mobile (≤900px)**: a toolbar da lista de usuários ficava apertada (título + filtro + botão na mesma linha, overflow). Pedido: ordem vertical e alinhamento à esquerda.

## Ordem desejada

1. Título **Usuários**  
2. Botão **Atualizar** (abaixo do título, à esquerda)  
3. **Select** de status (abaixo do botão, à esquerda)  
4. **Input** de pesquisa (abaixo do select, à esquerda)

## Solução

Só CSS em `web/src/index.css`, dentro de `@media (max-width: 900px)`:

- `.users-toolbar__top`: `flex-direction: column`, `align-items: stretch`.
- `.users-toolbar__actions`: coluna, `margin-left: 0`, `align-items: flex-start`.
- No DOM o `<select>` vem antes do botão; uso de **`order`** (`button` order 1, `select` order 2) com `flex-direction: column` em `.users-toolbar__actions`.
- Select e pesquisa com `width: 100%` (conteúdo alinhado à esquerda, largura útil); botão com `align-self: flex-start`.

Desktop (≥901px) inalterado.

## Validação

`npm run build` em `web/`. Inspecionar módulo Usuários em viewport ≤900px.
