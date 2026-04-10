# LOG - 2026-04-10 07:27:52 - update master botao adicionar pasta junto upload

## Contexto do pedido

No modulo de Conteudos (usuario Master), foi solicitado ter o botao `Adicionar Pasta` no mesmo bloco de acoes onde ja existem `Adicionar PDF` e `Adicionar Imagem`, para facilitar criacao de subpastas.

## Acoes executadas

- Ajuste de UI em `web/src/App.tsx` no painel interno da pasta.
- Inclusao do botao `Adicionar Pasta` ao lado dos botoes de upload:
  - no estado com arquivos;
  - no estado vazio da pasta.
- Build de validacao: `npm run build:web`.
- Verificacao de lint: `ReadLints` em `web/src/App.tsx`.

## Solucao implementada

1. Adicionado botao `Adicionar Pasta` no grupo `.content-inside-panel__actions`.
2. Adicionado botao `Adicionar Pasta` no grupo `.content-inside-panel__cta-center`.
3. Botao reutiliza o handler existente `openFolderModal`, mantendo suporte para criar subpastas a partir da pasta atual.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__072752__update-master-botao-adicionar-pasta-junto-upload.md`

## Como validar

1. Login como `MASTER`.
2. Abrir modulo `Conteudos`.
3. Entrar em uma pasta.
4. Confirmar que aparecem os 3 botoes lado a lado:
   - `Adicionar Pasta`
   - `Adicionar PDF`
   - `Adicionar Imagem`
5. Criar nova pasta e verificar que ela fica como subpasta do contexto atual.

## Palavras-chave

- conteudos adicionar pasta ao lado upload
- subpasta dentro da pasta atual
- master ui conteudos acoes
