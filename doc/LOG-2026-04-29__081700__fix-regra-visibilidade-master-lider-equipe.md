# LOG: regra master/lider/equipe para usuários, conteúdos e tabelas

## Contexto do pedido

Aplicar regra de negócio hierárquica no Credilix:

- `MASTER` vê e acessa tudo.
- Apenas `MASTER` pode criar usuário `LIDER`.
- Cada `LIDER` enxerga somente a própria equipe (usuários criados para sua equipe).
- Conteúdos e tabelas devem ficar restritos ao escopo `LIDER > equipe`, sem compartilhamento entre líderes.

## Comandos executados

- Leitura de código e schema (`src/services.ts`, `src/types.ts`, `supabase/schema.sql`).
- Compilação backend: `npm run build`.
- Verificação de diagnósticos: `ReadLints` nos arquivos alterados.

## Solução implementada (passo a passo)

1. **Modelagem de hierarquia de usuários**
   - Adicionados os campos `created_by_user_id` e `leader_user_id` em `users` no `supabase/schema.sql`.
   - Incluídos índices para esses campos.
   - Mantido `alter table ... add column if not exists` para bancos já existentes.

2. **Tipos de domínio**
   - `TenantUser` passou a suportar:
     - `createdByUserId?: string`
     - `leaderUserId?: string`

3. **Regras de convite/criação**
   - Em `inviteUser`:
     - bloqueio explícito: somente `MASTER` pode criar `LIDER`.
     - gravação de `created_by_user_id`.
     - definição de `leader_user_id` por regra:
       - novo líder: aponta para si próprio;
       - usuário criado por líder: aponta para o líder criador;
       - demais casos: herda contexto do criador quando aplicável.
   - Compatibilidade mantida para bancos sem as colunas (checagem dinâmica por coluna).

4. **Escopo de visibilidade por equipe**
   - Criadas funções de apoio no service:
     - resolução de líder da equipe do usuário logado;
     - cálculo de IDs visíveis por ator;
     - filtro de linhas por `created_by`.
   - `MASTER` mantém acesso total.

5. **Aplicação da regra nas listagens**
   - `listUsers` filtrado por escopo visível.
   - `listProducts`, `listBanks`, `listCommissionTables`, `listContents` filtrados por criador dentro do escopo.

6. **Aplicação da regra nas ações sensíveis**
   - Bloqueio de acesso fora do escopo em:
     - `approveUser`
     - `blockUser`
     - `updateUserProfileByManager`
     - `setUserLifecycleStatus`
     - `resetUserAccessByManager`
   - Reforço em tabelas/produtos/conteúdos:
     - update/delete de tabelas e produto validam escopo;
     - download/exclusão de conteúdo validam escopo;
     - exclusão por pasta filtra por escopo;
     - criação de tabela valida produto dentro do escopo.

## Arquivos alterados

- `src/services.ts`
- `src/types.ts`
- `supabase/schema.sql`

## Como validar

1. Rodar backend:
   - `npm run build`
   - `npm run dev`
2. Cenário de permissão:
   - Como `MASTER`, criar dois líderes A e B.
   - Como líder A, criar vendedores/suporte da equipe A e cadastrar conteúdos/tabelas.
   - Como líder B, verificar que não vê usuários/conteúdos/tabelas da equipe A.
   - Como `MASTER`, verificar visão completa.
3. Validar restrição:
   - Tentar criar `LIDER` com usuário não master (deve falhar).

## Observações de segurança

- A regra de isolamento foi aplicada em backend (não apenas UI), reduzindo risco de acesso indevido por chamada direta de API.
- Nenhum segredo novo foi adicionado em código.

## Palavras-chave para evitar duplicação futura

- visibilidade por lider
- equipe por leader_user_id
- somente master cria lider
- isolamento conteudo tabela por equipe
