## Contexto do pedido

Vendedor não recebia alerta em tempo real após líder definir repasse de comissão sem refresh.

## Solução aplicada

1. Backend (`src/routes.ts`)
   - Em `POST /commission-tables/:id/use`, além de `commission-tables-updated`, agora publica:
     - `commission-repasse-defined`

2. Frontend (`web/src/App.tsx`)
   - Listener SSE passou a tratar `commission-repasse-defined`.
   - Para perfil `VENDEDOR`, se não estiver no módulo `products`, incrementa badge de comissão imediatamente.
   - Em seguida atualiza dados de comissão com `refreshCommissionOnly()`.

## Resultado

- Ao líder definir repasse, o vendedor recebe alerta sem refresh manual.

## Validação

- `npm run build` OK
- `npm run build:web` OK

## Palavras-chave

- alerta vendedor repasse realtime
- commission-repasse-defined
- sem refresh tabela comissao
