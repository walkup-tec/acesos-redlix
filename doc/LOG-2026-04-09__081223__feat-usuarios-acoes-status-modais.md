# LOG — Usuários: status de negócio, coluna Ação e modais de gestão

## Contexto

Pedido para:

- Exibir 3 status de negócio na tela de usuários (Ativo, Pendente, Inativo).
- Adicionar coluna **Ação** com menu de 3 pontos contendo: Editar, Reset, Inativar e Bloquear.
- Exigir observação/motivo para ações (exceto Reset).
- Edição via modal com dados de cadastro do usuário.

## Solução implementada

### Backend (API)

- Novo endpoint `PATCH /api/users/:id/status`
  - Body: `{ status: "INACTIVE" | "BLOCKED", reason: string }`
  - Motivo obrigatório.
- Novo endpoint `POST /api/users/:id/reset-access`
  - Executa reset de acesso e envia e-mail com senha temporária.
  - Sem motivo obrigatório (conforme pedido).
- Novo endpoint `PUT /api/users/:id`
  - Atualiza dados de perfil/validação e e-mail.
  - Body inclui motivo obrigatório (`reason`).
- Service layer (`src/services.ts`) com regras de autorização (`assertCanManageUsers`) e isolamento por tenant (`tenant_id` em todas as consultas/updates).
- Adicionada persistência de observação em `users.status_reason`.

### Frontend (UI)

- Tabela de usuários agora tem coluna **Ação**.
- Botão de 3 pontos por linha abre menu com:
  - `Editar`
  - `Reset`
  - `Inativar`
  - `Bloquear`
- Modais implementados:
  - Inativar/Bloquear: exigem campo de motivo.
  - Reset: confirmação sem motivo.
  - Editar: carrega dados atuais (nome, e-mail, perfil, CPF, RG, nascimento, endereço) + motivo obrigatório + botão Salvar.
- Status de negócio na UI mapeados para 3 rótulos:
  - `Ativo` (status `ACTIVE` com `firstAccessVerifiedAt`)
  - `Pendente` (demais casos pendentes)
  - `Inativo` (status `INACTIVE` ou `BLOCKED`)

## Observação importante de segurança

- Não é possível recuperar a "última senha" real de forma segura porque senhas são armazenadas com hash.
- No reset, a implementação envia **senha temporária nova** por e-mail (boas práticas de segurança).

## Arquivos alterados

- `src/routes.ts`
- `src/services.ts`
- `src/types.ts`
- `supabase/schema.sql`
- `supabase/migration-2026-04-09-user-status-actions.sql`
- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `npm run build` (backend): OK.
- `cd web && npm run build` (frontend): OK.

## Palavras-chave

- usuarios coluna acao 3 pontos
- editar reset inativar bloquear modal
- status ativo pendente inativo
- status_reason users
