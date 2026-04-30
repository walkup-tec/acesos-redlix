## Contexto do pedido

Ajustar o módulo `Login Banco` para que, no caso de `LIDER` e `MASTER`, seja obrigatório informar para qual usuário a solicitação será feita, com input de pesquisa e seleção de usuários cadastrados.

## Ações executadas

- Backend atualizado para aceitar e persistir `targetUserId` na solicitação.
- Validação de regra de negócio adicionada para exigir usuário-alvo quando o ator é `LIDER` ou `MASTER`.
- Frontend atualizado com input de pesquisa e select de usuário.
- Lista de solicitações atualizada para exibir o usuário relacionado.
- Build backend/frontend executado para validar.

## Solução implementada

1. `supabase/schema.sql`
   - Campo `target_user_id` incluído na tabela `bank_login_requests`.
   - `alter table ... add column if not exists` adicionado para compatibilidade em bases já criadas.

2. `src/types.ts`
   - Interface `BankLoginRequest` atualizada com `targetUserId?: string`.

3. `src/services.ts`
   - `createBankLoginRequest` agora recebe `targetUserId`.
   - Para `MASTER`/`LIDER`, `targetUserId` é obrigatório.
   - Usuário-alvo validado por visibilidade do ator.
   - `supervisor_user_id` passa a ser resolvido com base no usuário-alvo.
   - Persistência e leitura de `target_user_id` adicionadas.

4. `src/routes.ts`
   - Endpoint `POST /api/bank-login-requests` agora aceita `targetUserId` opcional no payload.

5. `web/src/App.tsx`
   - Adicionados estados de busca e seleção de usuário.
   - Para `MASTER`/`LIDER`, formulário exibe:
     - input `Pesquisar usuário`
     - select `Usuário da solicitação` (obrigatório)
   - Envio inclui `targetUserId`.
   - Tabela de solicitações passou a exibir coluna `Usuário`.

## Arquivos alterados

- `supabase/schema.sql`
- `src/types.ts`
- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`

## Como validar

1. Aplicar SQL atualizado no Supabase (coluna `target_user_id`).
2. Logar como `MASTER` ou `LIDER`.
3. Ir em `Login Banco`, pesquisar um usuário e selecionar.
4. Selecionar produto e banco, clicar `Solicitar`.
5. Confirmar criação sem erro e usuário exibido na listagem.

## Observações de segurança

- Escopo multi-tenant e validação de visibilidade de usuário foram mantidos.
- Nenhum segredo/token foi exposto.

## Palavras-chave

- login banco selecionar usuario
- target_user_id bank_login_requests
- lider master solicitar para usuario
