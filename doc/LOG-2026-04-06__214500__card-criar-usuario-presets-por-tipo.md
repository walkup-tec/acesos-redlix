# LOG: Card criar usuário à esquerda com presets por tipo

## Contexto

Ajuste solicitado:
- manter card de criação de usuário à esquerda;
- topo com e-mail + select de tipo;
- presets automáticos por tipo (`Vendedor`, `Suporte`, `Líder`);
- permitir ajuste manual das permissões (principalmente para master).

## Implementação

1. **Frontend (`web/src/App.tsx`)**
   - Removido modal de criação; card ficou no lado esquerdo no módulo de usuários (`module-grid`).
   - Adicionado select `Tipo de usuário` com opções:
     - `Vendedor`
     - `Suporte`
     - `Líder`
   - Presets aplicados ao trocar tipo:
     - **Vendedor**: `Acessar conteúdo=true`, sem edição de conteúdos.
     - **Suporte**: `Autorizar/Ativar usuários=true`.
     - **Líder**: criar gestores, criar vendedores, editar/criar tabela, editar/criar conteúdos.
   - Checkboxes continuam editáveis; envio inclui `role`, `canManageUsers`, `permViewContents` e demais permissões.
   - Navegação e acesso ao módulo de conteúdos passam a considerar `canViewContents`.

2. **Backend (`src/services.ts`, `src/routes.ts`, `src/auth.ts`, `src/types.ts`)**
   - `InviteUserPermissions` agora recebe `role`, `canManageUsers`, `permViewContents`.
   - `inviteUser` usa o `role` selecionado no frontend.
   - `assertInviterCanGrant` valida concessões extras (ativação e acesso a conteúdo) para não-master.
   - `listContents` protegido por `assertCanViewContents`.
   - `AuthContext`, `TenantUser` e `PublicTenantUser` incluem `permViewContents`.
   - JWT inclui e normaliza claim `permViewContents`.

3. **Banco (`supabase/schema.sql`, migration)**
   - Nova coluna: `perm_view_contents boolean not null default true`.
   - Migration atualizada para popular `perm_view_contents` em perfis existentes.

## Arquivos alterados

- `web/src/App.tsx`
- `src/services.ts`
- `src/routes.ts`
- `src/auth.ts`
- `src/types.ts`
- `supabase/schema.sql`
- `supabase/migration-2026-04-06-user-permissions.sql`
- `doc/memoria.md`

## Como validar

1. Rodar migration no Supabase:
   - `supabase/migration-2026-04-06-user-permissions.sql`
2. Build:
   - `npx tsc --noEmit`
   - `npm run build --prefix web`
3. No módulo usuários:
   - Card de criação aparece à esquerda.
   - Trocar tipo no select altera checkboxes automaticamente.
   - Master pode ajustar manualmente os checkboxes antes de criar.

## Segurança

- Permissões concedidas continuam validadas no backend.
- Isolamento por tenant preservado em todas as consultas.

## Palavras-chave

- card criar usuario esquerda
- presets vendedor suporte lider
- perm_view_contents
- invite role permissions
