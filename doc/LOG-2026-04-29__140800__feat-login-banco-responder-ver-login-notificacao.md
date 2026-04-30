## Contexto do pedido

Evoluir o módulo `Login Banco` para incluir:
- ação `Responder` por líder imediato/master;
- modal com `Nome do Banco`, `Produto`, `Usuário`, `Senha`;
- notificação para o solicitante após resposta;
- separação da listagem em `Usuários Solicitados` e `Usuários Criados`;
- ação `Ver Login` apenas para visualização.

## Ações executadas

- Schema do Supabase atualizado para suportar resposta da solicitação.
- Backend atualizado com endpoints de resposta e marcação de visualização.
- Frontend atualizado com:
  - botão `Responder` em pendentes;
  - modal de resposta;
  - duas seções de listagem;
  - botão `Ver Login` em respondidos;
  - modal de visualização (somente leitura).

## Solução implementada

1. Banco (`supabase/schema.sql`)
   - Novas colunas em `bank_login_requests`:
     - `login_user`
     - `login_password`
     - `resolved_by_user_id`
     - `resolved_at`
     - `requester_viewed_at`
   - Mantido `target_user_id` com `add column if not exists`.

2. Backend
   - `src/types.ts`
     - `BankLoginRequest` expandido com campos de resposta/notificação.
   - `src/services.ts`
     - `respondBankLoginRequest(auth, requestId, { loginUser, loginPassword })`
       - Permite responder apenas para `MASTER` ou supervisor da solicitação.
       - Atualiza status para `RESOLVED` e grava credenciais.
     - `markBankLoginRequestViewed(auth, requestId)`
       - Marca resposta como visualizada pelo solicitante.
     - `getPendingBankLoginRequestCount(auth)`
       - `MASTER/LIDER`: conta pendentes para resposta.
       - Solicitante: conta respostas resolvidas não visualizadas (notificação).
   - `src/routes.ts`
     - `POST /api/bank-login-requests/:id/respond`
     - `POST /api/bank-login-requests/:id/viewed`

3. Frontend (`web/src/App.tsx`)
   - Lista separada em:
     - `Usuários Solicitados` (pendentes)
     - `Usuários Criados` (respondidos)
   - Ação `Responder` (quando permitido) abre modal com campos solicitados.
   - Ação `Ver Login` abre modal de leitura.
   - Ao abrir `Ver Login` como solicitante, marca resposta como visualizada.

## Arquivos alterados

- `supabase/schema.sql`
- `src/types.ts`
- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`

## Como validar

1. Aplicar SQL atualizado no Supabase.
2. Criar solicitação com usuário solicitante.
3. Logar como líder imediato/master e responder.
4. Confirmar:
   - item sai de `Usuários Solicitados`;
   - item entra em `Usuários Criados`;
   - botão `Ver Login` abre modal read-only com usuário/senha;
   - solicitante recebe notificação via contador até visualizar.

## Observações de segurança

- Nenhum segredo foi logado no backend.
- Escopo por `tenant_id` mantido em todas operações.
- Resposta permitida apenas a `MASTER` ou supervisor da solicitação.

## Palavras-chave

- login banco responder
- ver login read only
- usuario solicitado criado
- notificacao solicitante resolvido
