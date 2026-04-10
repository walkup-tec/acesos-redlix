# LOG — Usuários: colunas ID/CPF e geração de ID do sistema

## Contexto

Solicitado melhorar a distribuição das informações e adicionar duas colunas na tabela de usuários:

1. `ID` (primeira coluna) com padrão por perfil:
   - Vendedor: `V-####`
   - Líder: `L-####`
   - Suporte: `S-####`
2. `CPF` (segunda coluna)

As demais colunas mantidas na sequência atual.

## Implementação

### Backend

- Adicionado campo `system_code` em `users` (schema + migration), com unicidade por tenant:
  - `unique (tenant_id, system_code)`
- Regras de geração de código no service:
  - Prefixo por role (`V`, `L`, `S`; `M` para MASTER)
  - Sufixo numérico de 4 dígitos (`0000-9999`)
  - Validação de não repetição no tenant antes de gravar
- Código gerado:
  - na criação de convite (`inviteUser`)
  - no bootstrap do usuário master
  - auto-preenchimento para usuários antigos sem código em `listUsers`, `login` e `getCurrentUserProfile`
- Na edição de usuário:
  - se o perfil/role mudar e o prefixo precisar mudar, o sistema gera novo `system_code` válido

### Frontend

- Tabela de usuários atualizada para:
  - 1ª coluna: `ID`
  - 2ª coluna: `CPF`
  - depois: `Nome`, `E-mail`, `Perfil`, `Status`, `Ação`
- `ID` exibe `systemCode` vindo da API
- `CPF` exibe `user.profile?.cpf` (ou `—`)
- Ajustes de largura/estilo para melhor distribuição visual (`users-col-id`, `users-col-cpf`, `user-actions-cell`).

## Arquivos alterados

- `src/types.ts`
- `src/services.ts`
- `supabase/schema.sql`
- `supabase/migration-2026-04-09-user-system-code.sql`
- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `npm run build` (backend) — OK
- `cd web && npm run build` (frontend) — OK
- lint sem erros nos arquivos alterados

## Palavras-chave

- users system code
- coluna id cpf usuarios
- V-1234 L-1234 S-1234
- unique tenant system_code
