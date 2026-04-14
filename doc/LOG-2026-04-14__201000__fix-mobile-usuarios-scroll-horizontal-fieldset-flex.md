# LOG: mobile Usuários — scroll horizontal (fieldset + checkbox flex)

## Contexto

Na tela **Usuários** (formulário Criar usuário), ainda aparecia barra de rolagem horizontal / página “andando” no eixo X no Safari (iPhone), apesar dos ajustes globais de viewport.

## Causa

1. **`<fieldset>`** (`.perm-fieldset`): no CSS do user agent, `fieldset` costuma ter **`min-inline-size: min-content`**, o que pode forçar largura maior que o pai e estourar a viewport.
2. **`.checkbox-row span`** com **`flex: 1`** sem **`min-width: 0`**: itens flex usam `min-width: auto` por padrão e não encolhem abaixo do tamanho do texto, ampliando o layout.
3. Reforço: **`.module-grid`**, **`.card`**, **`input`/`select`** com `max-width: 100%` e `min-width: 0` onde faltava.
4. **`.shell-body`** com **`overflow-x: hidden`** no mobile para cortar qualquer vazamento residual sem afetar scroll horizontal **dentro** de `.table-wrap`.
5. **Toolbar de usuários**: `.users-toolbar__top` com `flex-wrap: wrap` e filtro com `min-width: 0` no mobile para evitar linha rígida com `min-width: 10.5rem`.

## Arquivos alterados

- `web/src/index.css`

## Como validar

1. `npm run build` em `web/`.
2. iPhone / DevTools &lt; 901px: **Usuários** — formulário e, ao rolar, toolbar + tabela; não deve haver scroll horizontal na página (só na área da tabela se `.table-wrap`).

## Palavras-chave

- fieldset min-inline-size min-content mobile
- checkbox-row flex min-width 0- usuarios credilix overflow-x
