# LOG: Usuários — select de filtro com mesma altura do botão Atualizar

## Contexto

Na toolbar da lista de usuários, o `<select>` (ex.: "Todos") aparecia com altura diferente do botão **Atualizar**.

## Causa

O botão usa `.btn-secondary` + `.card-toolbar__action-btn`; o padding efetivo vinha de `.btn-secondary` (`0.55rem 0.95rem`), enquanto `.users-toolbar__filter-select` tinha padding menor (`0.36rem 0.6rem`). Além disso, `<select>` costuma renderizar altura distinta do `button` no WebKit.

## Solução

Em `web/src/index.css`, regra compartilhada para `.users-toolbar__actions .users-toolbar__filter-select` e `.users-toolbar__actions .btn-secondary.card-toolbar__action-btn` com o mesmo `min-height`, `padding`, `font-size`, `line-height` e `box-sizing`.

## Validação

`npm run build` em `web/`. Conferir visualmente select e botão alinhados na mesma linha.
