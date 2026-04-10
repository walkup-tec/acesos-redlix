# Contexto do pedido

Usuário pediu remover a listagem externa de bancos e adotar fluxo manual:

- cadastrar banco manualmente;
- depois usar banco já cadastrado em select;
- comportamento igual ao fluxo de produto (novo ou existente).

# Ações executadas

1. Removido consumo da API externa de bancos no frontend.
2. Criado recurso próprio de bancos no backend (`POST /banks`, `GET /banks`).
3. Criada tabela `banks` no schema/migration Supabase.
4. Ajustado formulário de criação de tabela para banco novo ou existente.

# Solução implementada

## Backend

- `src/types.ts`
  - novo tipo `Bank`.
  - `DatabaseState` atualizado com `banks`.

- `src/services.ts`
  - `createBank(auth, name)`.
  - `listBanks(auth)`.

- `src/routes.ts`
  - `POST /api/banks` (criação manual de banco).
  - `GET /api/banks` (lista de bancos do tenant).

- `src/database.ts`
  - estado inicial inclui `banks: []`.

## Banco (Supabase)

- `supabase/schema.sql`
  - nova tabela `public.banks` + índice `tenant_id`.
  - RLS habilitado e policy `service_role_full_access_banks`.

- `supabase/migration-2026-04-07-banks-table.sql`
  - migration completa da tabela/policy de bancos.

## Frontend

- `web/src/App.tsx`
  - removida lógica de bancos via internet/fallback.
  - novo estado local:
    - `banks`
    - `isTypingNewBank`
    - `selectedBankValue`
    - `bankName`
  - `refreshAll` agora também carrega `/banks`.
  - campo Banco no formulário:
    - select com opção `+ Adicionar Banco`;
    - input quando usuário escolhe cadastrar novo banco;
    - validações obrigatórias mantidas.

# Arquivos alterados/criados

- `src/types.ts`
- `src/services.ts`
- `src/routes.ts`
- `src/database.ts`
- `supabase/schema.sql`
- `supabase/migration-2026-04-07-banks-table.sql` (novo)
- `web/src/App.tsx`

# Como validar

1. Executar migration no Supabase.
2. Abrir módulo `Tabela de Comissão`.
3. No campo Banco:
   - selecionar `+ Adicionar Banco`;
   - cadastrar banco novo;
   - criar tabela.
4. Voltar ao campo Banco e confirmar que o banco cadastrado aparece no select.

# Observações de segurança

- Não há exposição de segredos.
- Dados de banco ficam isolados por tenant (`tenant_id`).

# Palavras-chave

- bancos cadastro manual
- select banco novo ou existente
- api banks tenant
- migration banks supabase
