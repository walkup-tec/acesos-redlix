# LOG: repasse do líder via ação "Utilizar" em tabela de comissão

## Contexto

Solicitado fluxo de comissão:

- MASTER cria as tabelas base.
- LÍDER visualiza tabelas do MASTER e só pode usar ação `Utilizar`.
- No `Utilizar`, LÍDER define repasse menor que a comissão do MASTER.
- Vendedores da equipe do líder enxergam somente o percentual de repasse definido pelo líder.

## Implementação

### Backend

- `src/services.ts`
  - `assertCanEditCommissionTables` restrito a `MASTER`.
  - Novo `applyLeaderCommissionRepasse(auth, tableId, commissionPercent)`.
  - `listCommissionTables` com visão por perfil:
    - `MASTER`: tabelas base.
    - `LIDER`: tabelas base do MASTER + repasse aplicado (se existir).
    - equipe do líder (`VENDEDOR`/`SUPORTE`): somente tabelas com repasse já definido pelo líder.
  - Ajustes auxiliares para resolução de líder da sessão e IDs de master por tenant.

- `src/routes.ts`
  - Novo endpoint: `POST /api/commission-tables/:id/use` (ação `Utilizar` do líder).

- `src/types.ts`
  - `CommissionTable` com campos opcionais:
    - `baseCommissionPercent`
    - `leaderRepassePercent`
    - `leaderRepasseDefined`

### Frontend

- `web/src/App.tsx`
  - `canEditCommissionTables` agora só para `MASTER`.
  - Para `LIDER`, botão único `Utilizar` na linha da tabela.
  - Modal de utilização com dados da tabela + campo de repasse.
  - Validação UI: repasse deve ser menor que comissão master.
  - Exibição de comissão efetiva com referência à base master quando aplicável.

### Banco (Supabase)

- `supabase/schema.sql`
  - Nova tabela `commission_table_leader_overrides` para persistir repasses por líder+tabela.
  - Índices e policy `service_role`.

## Validação técnica

- `npm run build` (ok)
- `npm run build:web` (ok)
- `ReadLints` sem erros nos arquivos alterados

## Observações

- Para funcionar em produção, é necessário executar o SQL atualizado no Supabase (nova tabela de repasse).

## Palavras-chave

- utilizar tabela lider
- repasse menor que master
- comissao por equipe vendedor
