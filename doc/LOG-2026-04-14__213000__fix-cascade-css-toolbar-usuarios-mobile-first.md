# LOG: correção de cascata — toolbar Usuários não aplicava layout mobile

## Problema

O layout pedido (mobile: coluna com título → Atualizar → filtro → pesquisa) **não aparecia** no site: título e botão ficavam na mesma linha e o select à direita, como no desktop.

## Causa raiz

Regras em `@media (max-width: 900px)` vinham **antes** no arquivo que a regra global:

```css
.users-toolbar__top { flex-direction: row; ... }
```

Com **mesma especificidade** (um seletor de classe), a regra que aparece **por último** no CSS vence. O `row` global sobrescrevia o `column` do media query em **todas** as larguras.

## Solução

1. **Mobile-first na base**: `.users-toolbar__top` e `.users-toolbar__actions` como **coluna** por padrão; `order` no botão/select para a ordem visual correta.
2. **Desktop** (`@media (min-width: 901px)`): sobrescreve para **linha** (`flex-direction: row`, `margin-left: auto` nas ações, `order: 0`).
3. Removido o bloco duplicado que só repetia o mesmo dentro do primeiro `@media (max-width: 900px)`.

## Arquivo

- `web/src/index.css`

## Validação

`npm run build` em `web/`. Em viewport &lt; 901px o stack vertical deve aparecer sem depender da ordem no arquivo.
