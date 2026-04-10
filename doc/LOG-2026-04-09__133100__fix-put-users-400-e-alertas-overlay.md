# LOG — Fix erro 400 ao editar usuário + alertas overlay

## Contexto

Persistia erro `400` no `PUT /api/users/:id` e pedido para melhorar visibilidade dos alertas.

## Causa raiz

- Banco do usuário ainda sem coluna `system_code` e/ou `status_reason` em alguns ambientes.
- O service de edição/login/listagem tentava ler/escrever essas colunas sem fallback, gerando falhas e resposta genérica.

## Correções backend

- `src/services.ts`
  - adicionadas checagens de compatibilidade de schema:
    - `hasSystemCodeColumn()`
    - `hasStatusReasonColumn()`
  - updates/inserts agora incluem colunas opcionais **somente quando existem**.
  - `toUserInsert` não força mais `status_reason` em insert.
  - fluxos `login`, `me` e `listUsers` só autogeram `system_code` quando a coluna existe.

- `src/routes.ts`
  - melhoria no `catch` de `PUT /users/:id` para retornar `message` real de erros-objeto (não apenas genérico).

## Correções frontend (alertas)

- `web/src/App.tsx` + `web/src/index.css`
  - alertas do sistema migrados para overlay fixo (`.system-alerts-overlay`) para maior visibilidade.

## Validação

- Build backend/frontend OK.
- Teste real de API:
  - `PUT /api/users/:id` retornando `200` com payload atualizado.

## Arquivos alterados

- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`
- `web/src/index.css`

## Palavras-chave

- put users 400 fix
- optional columns system_code status_reason
- alerts overlay
