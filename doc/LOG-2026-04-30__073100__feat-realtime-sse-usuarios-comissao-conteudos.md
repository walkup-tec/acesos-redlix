## Contexto do pedido

Eliminar dependência de refresh manual para visualizar novos registros em:
- usuários
- tabelas de comissão
- conteúdos

## Ações executadas

- Expandida emissão de eventos SSE no backend para mutações desses 3 módulos.
- Frontend já estava assinando `/api/events` e chamando `refreshAll()`, então passou a receber atualização automática também desses fluxos.

## Solução implementada

Arquivo alterado: `src/routes.ts`

Foram adicionados `publishRealtimeEvent(...)` após sucesso em operações de escrita:

1. Usuários (`users-updated`)
   - `POST /users/:id/complete-registration`
   - `POST /users/invite`
   - `POST /users/:id/approve`
   - `PATCH /users/:id/block`
   - `PATCH /users/:id/status`
   - `POST /users/:id/reset-access`
   - `PUT /users/:id`

2. Tabelas de comissão (`commission-tables-updated`)
   - `POST /commission-tables`
   - `POST /commission-tables/:id/use`
   - `POST /commission-tables/:id/deactivate`
   - `PATCH /commission-tables/:id`
   - `DELETE /commission-tables/:id`
   - `DELETE /commission-tables/by-product/:productId`
   - `PATCH /products/:id` (impacta listagem de comissão por produto)

3. Conteúdos (`contents-updated`)
   - `POST /contents`
   - `POST /contents/folder`
   - `DELETE /contents/folder`
   - `DELETE /contents/:id`

## Como validar

1. Abrir duas sessões simultâneas no mesmo tenant.
2. Criar/editar/excluir registro de usuário, comissão ou conteúdo em uma sessão.
3. Confirmar atualização automática da outra sessão sem refresh.

## Observações de segurança

- Eventos SSE não carregam payload sensível; servem como sinal para recarregar dados.
- Isolamento por `tenant_id` preservado no publisher/receptor.

## Palavras-chave

- realtime sse usuarios
- realtime sse comissao
- realtime sse conteudos
- sem refresh manual
