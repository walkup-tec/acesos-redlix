# LOG - 2026-04-10 07:31:16 - fix subpasta nao aparece dentro da pasta

## Contexto do pedido

Ao criar subpasta dentro de uma pasta no modulo Conteudos (Master), o usuario informou que a pasta nao aparecia.

## Causa raiz

A listagem de pastas ficava com classe `content-folders--hidden` quando `currentFolderPath` estava preenchido, ocultando a grade de subpastas no contexto interno.

## Solucao aplicada

- Em `web/src/App.tsx`, removida a classe de ocultacao para o estado dentro da pasta.
- Agora a grade de `content-folders` permanece visivel e mostra subpastas do nivel atual.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__073116__fix-subpasta-nao-aparece-dentro-da-pasta.md`

## Validacao

- `npm run build:web` executado com sucesso.
- `ReadLints` sem erros.

## Palavras-chave

- subpasta nao aparece
- content-folders hidden
- conteudos pasta dentro de pasta
