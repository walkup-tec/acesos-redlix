# LOG: Criar usuário (e-mail + permissões), controle de acesso, ícone SVG no menu

## Contexto

- Botão de recolher menu com caractere Unicode gerava artefato visual; substituído por SVG.
- Fluxo de convite renomeado para **Criar usuário**: apenas **e-mail** e **checkboxes** de permissão.
- Apenas **MASTER** ou usuário com **`can_manage_users`** vê o botão/modal de criação.
- Backend passa a persistir quatro flags de permissão; convite valida que o criador só concede o que já possui (MASTER isenta).

## Ações executadas

1. **Supabase**: `supabase/migration-2026-04-06-user-permissions.sql` + colunas em `supabase/schema.sql` (`perm_create_managers`, `perm_create_sellers`, `perm_commission_tables`, `perm_contents`).
2. **Tipos / JWT**: `AuthContext` e `TenantUser` com as quatro permissões; `normalizeAuthContext` compatível com JWT antigos (MASTER ou `can_manage_users` recebem flags legadas).
3. **Services**: `inviteUser` com `{ email, permissions }`; derivação de `role` (LIDER se alguma permissão de convite; senão VENDEDOR) e `can_manage_users`; asserts em `createCommissionTable` / `createContent`; `toPublicTenantUser` para não expor `password_hash` / códigos.
4. **Routes**: POST `/users/invite` com novo body; respostas de usuário sanitizadas.
5. **Frontend**: sessão a partir do `user` no login; modal **Criar usuário**; menu lateral filtra Tabelas/Conteúdos sem permissão; formulários de criar tabela/conteúdo só se tiver permissão; chevron SVG no pin.

## Arquivos alterados / criados

- `supabase/migration-2026-04-06-user-permissions.sql` (criado)
- `supabase/schema.sql`
- `src/types.ts`, `src/auth.ts`, `src/services.ts`, `src/routes.ts`
- `web/src/App.tsx`, `web/src/index.css`

## Como validar

1. Rodar o SQL de migração no Supabase (novas colunas + updates legados).
2. `npx tsc --noEmit` na raiz; `npm run build` em `web/`.
3. Login como MASTER: criar usuário com combinações de permissões; login como VENDEDOR sem `can_manage_users`: não deve aparecer **Criar usuário**.

## Segurança

- Hash de senha e códigos não são mais devolvidos nas APIs de listagem / login (`toPublicTenantUser`).
- Concessão de permissões validada no servidor contra o JWT normalizado.

## Palavras-chave

- criar usuario permissoes checkbox
- inviteUser permissions supabase
- normalizeAuthContext jwt legado
- shell-nav chevron svg
