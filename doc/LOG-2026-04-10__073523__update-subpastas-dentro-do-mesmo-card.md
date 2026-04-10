# LOG - 2026-04-10 07:35:23 - update subpastas dentro do mesmo card

## Contexto do pedido

A subpasta deveria aparecer no mesmo card da pasta atual, logo abaixo dos arquivos importados.

## Solucao implementada

- No contexto de pasta aberta (`currentFolderPath`), a renderizacao de subpastas foi movida para dentro do `content-inside-panel`, abaixo da lista de arquivos.
- A listagem de pastas na raiz (`content-folders--root`) ficou restrita apenas ao modo raiz.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__073523__update-subpastas-dentro-do-mesmo-card.md`

## Validacao

- `npm run build:web` executado com sucesso.
- `ReadLints` sem erros no arquivo alterado.

## Palavras-chave

- subpasta no mesmo card
- conteudos abaixo dos arquivos
- currentFolderPath render
