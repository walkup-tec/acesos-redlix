# LOG: update usuarios - ativar apos bloqueio e flag de motivo

## Contexto

Solicitado:
- após bloquear usuário, ação deve virar **Ativar** (verde com check), permitindo reativação;
- usuário bloqueado/inativo deve perder acesso ao login;
- exibir uma "flag" na tabela de usuários com o motivo registrado (`status_reason`), no mesmo padrão de observação da tabela de comissão.

## Solução implementada

1. **Frontend (`web/src/App.tsx`)**
   - Fluxo de ação de usuário passou a aceitar `ACTIVE` além de `INACTIVE`/`BLOCKED`.
   - Botão de ação agora alterna dinamicamente:
     - pendente: Aprovar;
     - bloqueado/inativo: **Ativar** (check verde);
     - demais ativos: Bloquear.
   - Modal de status passou a suportar **Ativar usuário** (confirmação sem motivo obrigatório).
   - Célula de status ganhou ícone de informação com popover/flag para `statusReason` (hover e clique), reaproveitando padrão visual já usado em comissão.

2. **Backend (`src/routes.ts`, `src/services.ts`)**
   - Endpoint `PATCH /users/:id/status` agora aceita `ACTIVE`, `INACTIVE` e `BLOCKED`.
   - `reason` ficou opcional para `ACTIVE` e obrigatório para `INACTIVE`/`BLOCKED`.
   - Serviço de ciclo de vida atualiza status para `ACTIVE` e define motivo padrão "Usuário reativado por gestor." quando não informado.

3. **Estilos (`web/src/index.css`)**
   - Novo estilo para botão `user-inline-btn--activate` (verde, claro/escuro).
   - Estilos para composição do status com flag (`user-status-with-reason`, `user-status-reason-wrap`, `user-status-reason-icon`).

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`
- `src/routes.ts`
- `src/services.ts`

## Validação

- `npm run build` (backend) OK
- `npm run build --prefix web` (frontend) OK

## Segurança

- Sem exposição nova de segredos.
- Regra de login bloqueado mantida: autenticação só permite `status === ACTIVE`.

## Palavras-chave

- ativar usuario apos bloqueio
- status_reason flag usuarios
- users status active inactive blocked
