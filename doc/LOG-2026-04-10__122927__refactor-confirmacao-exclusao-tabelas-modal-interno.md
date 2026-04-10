# LOG - 2026-04-10 12:29:27 - refactor confirmacao exclusao tabelas modal interno

## Contexto do pedido

Trocar alertas nativos do navegador (`window.confirm`) por modal interno do sistema, no mesmo formato usado para exclusao de conteudos.

## O que foi feito

- Removidos `window.confirm` de:
  - exclusao de tabela individual;
  - exclusao de todas as tabelas do card de produto.
- Adicionados estados de confirmacao no frontend para cada caso:
  - `pendingDeleteCommissionTableId/Label`
  - `pendingDeleteProductTablesId/Label`
- Criados fluxos de abertura de modal:
  - `requestDeleteCommissionTable(...)`
  - `requestDeleteProductTables(...)`
- Mantidas acoes reais de exclusao em handlers dedicados:
  - `handleDeleteCommissionTable()`
  - `handleDeleteProductTables()`
- Incluidos dois modais de confirmacao no mesmo padrao visual de `content-modal--confirm-delete`.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__122927__refactor-confirmacao-exclusao-tabelas-modal-interno.md`

## Validacao

- `npm run build:web` executado com sucesso.
- `ReadLints` sem erros no arquivo alterado.

## Palavras-chave

- remover window.confirm
- modal interno exclusao tabela
- confirmar exclusao card produto
