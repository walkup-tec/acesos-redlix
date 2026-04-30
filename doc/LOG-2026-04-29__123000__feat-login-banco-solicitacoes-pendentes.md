## Contexto do pedido

Criar o novo menu `Login Banco` para permitir que qualquer usuário solicite logins em banco com base em produtos/bancos já usados na criação das tabelas, mantendo as regras de visibilidade por líder imediato e master, com indicador de pendências no menu lateral e sino no topo.

## Ações executadas

- Adição de estrutura de persistência para solicitações de login em banco no schema Supabase.
- Implementação de serviços backend para criar solicitação, listar solicitações por escopo e contar pendências.
- Criação de endpoints REST para o novo fluxo.
- Implementação da nova tela `Login Banco` no frontend com formulário e listagem.
- Inclusão de contador de pendências no menu lateral e sino no topo.
- Build completo de validação (`npm run build` e `npm run build:web`).

## Solução implementada (passo a passo)

1. `supabase/schema.sql`
   - Criada tabela `public.bank_login_requests` com vínculo de tenant, solicitante, supervisor, produto e banco.
   - Criados índices para tenant, supervisor e status.
   - Habilitado RLS e policy para `service_role`.

2. `src/services.ts`
   - Adicionado detector de compatibilidade `hasBankLoginRequestsTable()`.
   - Criado `createBankLoginRequest(auth, { productId, bankName })` com validação de escopo por visibilidade.
   - Criado `listBankLoginRequests(auth)` com regra:
     - `MASTER`: vê tudo do tenant.
     - `LIDER`: vê solicitações dele e as direcionadas a ele.
     - Demais usuários: veem apenas as próprias.
   - Criado `getPendingBankLoginRequestCount(auth)` para alimentar badge de pendências.

3. `src/routes.ts`
   - `POST /api/bank-login-requests`
   - `GET /api/bank-login-requests`
   - `GET /api/bank-login-requests/pending-count`

4. `web/src/App.tsx`
   - Novo módulo `bankLogins` no menu lateral.
   - Novo card com formulário:
     - select de `Produto` (derivado das tabelas visíveis);
     - select de `Banco` (derivado dos bancos usados nas tabelas visíveis);
     - botão `Solicitar` com estado de loading.
   - Nova listagem de solicitações com status e data.
   - Sino no topo com badge de pendências e atalho para o módulo.
   - Badge de pendências no item `Login Banco` do menu.
   - `refreshAll` atualizado para carregar solicitações e contador pendente.

5. `web/src/index.css`
   - Estilos do badge do menu.
   - Estilos do sino do header e badge numérico.

## Arquivos alterados

- `supabase/schema.sql`
- `src/types.ts`
- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`
- `web/src/index.css`

## Como validar

1. Executar SQL atualizado do `supabase/schema.sql` no Supabase (ou ao menos a criação de `bank_login_requests`).
2. Rodar backend/frontend localmente.
3. Acessar módulo `Login Banco`.
4. Criar solicitação para um produto e banco visíveis.
5. Confirmar:
   - registro aparece na lista;
   - contador no menu e no sino incrementa;
   - líder e master recebem visualização conforme escopo.

## Observações de segurança

- Nenhuma credencial/senha/token foi exposta.
- Escopo multi-tenant preservado por `tenant_id`.
- Regras de visibilidade respeitam hierarquia `MASTER > LIDER > equipe`.

## Evitar duplicação (palavras-chave)

- login banco solicitacao pendente
- bank_login_requests
- badge menu sino topo
- pending count supervisor master
