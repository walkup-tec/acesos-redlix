## Contexto do pedido

Implementar atualização automática dos alertas de solicitação de login em banco, sem necessidade de refresh manual da página.

## Ações executadas

- Adicionado canal realtime via SSE no backend.
- Publicação de eventos ao criar/responder/visualizar solicitações de login banco.
- Frontend passou a assinar stream de eventos e chamar `refreshAll()` automaticamente.

## Solução implementada

1. Backend realtime
   - Novo arquivo `src/realtime.ts` com registro/remoção de clientes e publicação por tenant/usuário.
   - Novo endpoint `GET /api/events` (SSE) em `src/routes.ts`, autenticado por token query.
   - Envio de heartbeat para manter conexão ativa.

2. Eventos emitidos
   - `POST /api/bank-login-requests`: publica `bank-login-updated`.
   - `POST /api/bank-login-requests/:id/respond`: publica `bank-login-updated`.
   - `POST /api/bank-login-requests/:id/viewed`: publica `bank-login-updated` focado no usuário que visualizou.

3. Frontend
   - `web/src/App.tsx` agora abre `EventSource` para `/api/events?token=...`.
   - Ao receber evento, executa `refreshAll()` para atualizar badges/listagens em tempo real.

## Arquivos alterados

- `src/realtime.ts` (novo)
- `src/auth.ts`
- `src/routes.ts`
- `web/src/App.tsx`

## Como validar

1. Abrir duas sessões (ex.: solicitante e líder/master).
2. Criar solicitação em uma sessão.
3. Confirmar atualização automática de contador/lista na outra, sem refresh.
4. Responder solicitação e validar atualização automática para solicitante.

## Observações de segurança

- Token validado no backend antes de abrir stream.
- Eventos segregados por `tenant_id`, com filtro opcional por `user_id`.
- Sem exposição de dados sensíveis no payload do evento (apenas sinal de atualização).

## Palavras-chave

- webhook realtime sse
- alerta sem refresh
- bank-login-updated
