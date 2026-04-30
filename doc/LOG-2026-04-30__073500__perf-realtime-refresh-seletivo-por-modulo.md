## Contexto do pedido

Otimizar atualização em tempo real para não executar `refreshAll()` em todo evento.

## Ações executadas

- Frontend passou a fazer refresh seletivo por tipo de evento SSE.
- Mantido fallback para `refreshAll()` quando tipo não for reconhecido.

## Solução implementada

Arquivo alterado: `web/src/App.tsx`

1. Criados loaders seletivos:
   - `refreshUsersOnly()`
   - `refreshCommissionOnly()` (`products`, `banks`, `commission-tables`)
   - `refreshContentsOnly()`
   - `refreshBankLoginOnly()` (`bank-login-requests` + `pending-count`)

2. `onmessage` do SSE agora:
   - lê `event.type` do payload
   - direciona para o loader específico:
     - `users-updated`
     - `commission-tables-updated`
     - `contents-updated`
     - `bank-login-updated`
   - fallback para `refreshAll()` em eventos desconhecidos

## Resultado

- Menor custo de rede e render por evento.
- Atualização em tempo real preservada.
- Menos risco de competição de estado entre módulos não afetados.

## Validação

- `npm run build` OK
- `npm run build:web` OK

## Palavras-chave

- realtime refresh seletivo
- sse event type routing
- performance frontend polling replacement
