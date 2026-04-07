# Memória consolidada do projeto

## 2026-04-06 - Supabase exclusivo + identidade visual Credilix

- Backend ajustado para usar Supabase como persistência exclusiva.
- Criado `supabase/schema.sql` com tabelas multi-tenant e RLS habilitado.
- Branding centralizado em `config.branding` com paleta baseada no site Credilix.
- Endpoint `GET /branding` adicionado para frontend consumir tema/logo.
- Setup documentado no `README.md` e variáveis novas no `.env.example`.

## 2026-04-06 - Frontend moderno integrado ao backend

- Criado frontend React + TypeScript em `web/`.
- Implementadas telas base: login, dashboard e módulos de usuários/produtos/tabelas/conteúdos.
- Integração com API backend para autenticação, CRUD principal e upload de conteúdo.
- Tema aplicado com cores Credilix consumidas via endpoint `GET /branding`.
- Variável `VITE_API_BASE_URL` configurada em `web/.env.example`.

### Palavras-chave para pesquisa futura

- supabase exclusivo
- credilix cores
- endpoint branding
- schema tenant users products commission
- service role backend
- frontend credilix
- painel saas moderno
- vite api base url
- ui servida na porta 5050 (web/dist + Express)
- npm run dev:ui

## 2026-04-06 - UI aero, mobile-first, menu recolhível

- Removido o módulo Dashboard; entrada padrão em Usuários.
- Layout “aero”: fundo em gradiente suave, navegação e header com vidro (`backdrop-filter`), cards claros.
- Mobile (abaixo de 901px de largura): menu em drawer, backdrop, botão hamburger; pin de recolher oculto.
- Desktop: sidebar fixa com botão para recolher (labels curtas quando colapsado).
- Logo com `object-fit: contain` e limites de largura/altura (login e nav).

### Palavras-chave

- ui aero glass credilix-acessos
- shell-nav drawer mobile
- navCollapsed app-shell--nav-collapsed

## 2026-04-06 - Criar usuário por e-mail + permissões; pin SVG

- Colunas `perm_*` em `public.users`; migração `supabase/migration-2026-04-06-user-permissions.sql`.
- POST `/users/invite` com `{ email, permissions: { permCreateManagers, permCreateSellers, permCommissionTables, permContents } }`; pelo menos uma permissão obrigatória; criador não-MASTER só concede o que já tem.
- UI: modal **Criar usuário** só para `role === MASTER` ou `canManageUsers`; menu e formulários de tabela/conteúdo condicionados às permissões.
- Respostas de usuário via `toPublicTenantUser` (sem segredos).
- Botão recolher menu: ícone SVG em vez de caractere.

### Palavras-chave

- perm_create_managers supabase
- toPublicTenantUser
- normalizeAuthContext JWT antigo

## 2026-04-06 - E-mail e fluxo público convite/ativar

- Envio: convite (link `/convite?token=`), aprovação (código primeiro acesso + `/ativar`), esqueci senha.
- `MAIL_MODE`: `log` (dev), `smtp` (produção), `off`; `MAIL_FROM` + `SMTP_*`; `APP_BASE_URL` nos links.
- `GET /api/auth/invite-context`; JWT de convite 7 dias (`signInviteToken`).
- UI: `onboarding-ui.tsx` (`/convite`, `/ativar`).

### Palavras-chave

- mailer nodemailer credilix-acessos
- convite token invite-context

## 2026-04-06 - Fix painel vazio pós-login (master)

- `resolvedSession` + decode JWT; master com `role.toUpperCase()`; login usa claims do token.
- `refreshAll` com `Promise.allSettled`; persistência `credilix_session`.

## 2026-04-06 - Card criar usuário à esquerda + presets por tipo

- Módulo de usuários voltou para layout com card à esquerda (sem modal) e listagem à direita.
- Topo do card: e-mail + select de tipo (`Vendedor`, `Suporte`, `Líder`).
- Presets automáticos por tipo com checkboxes editáveis:
  - Vendedor: acessar conteúdo (sem editar conteúdos)
  - Suporte: autorizar/ativar usuários
  - Líder: criar gestores, criar vendedores, editar/criar tabela, editar/criar conteúdos
- Backend: `POST /users/invite` passa a aceitar `role`, `canManageUsers`, `permViewContents`, `permCreateManagers`, `permCreateSellers`, `permCommissionTables`, `permContents`.
- Conteúdos agora exigem permissão de visualização (`assertCanViewContents` em `listContents`).
- Banco: nova coluna `perm_view_contents` em `users` (schema + migration).

## 2026-04-06 - Produto e comissão no mesmo fluxo

- Removida a aba separada de tabelas no frontend; fluxo consolidado em `Produtos`.
- Formulário `Produto + tabela inicial` cria produto e tabela em sequência no mesmo submit.
- Tela de produtos mostra lista de produtos e lista de tabelas na mesma página.
- Campo de produto com duas funções: **Adicionar nome novo** ou **Selecionar nome já criado**.

## 2026-04-06 - Observação opcional + validação obrigatória com alerta

- Tabela de comissão ganhou campo `observation` (opcional) no banco e backend.
- Frontend adicionou input `Observação (opcional)` no formulário de criação de tabela.
- Campos obrigatórios com alerta explícito (`alert`) quando ausentes:
  - Nome do produto
  - Nome da tabela
  - Comissão

## 2026-04-07 - Banco obrigatório + campos em linha na criação de tabela

- Criação de tabela ajustada para exibir em linha (desktop): `Produto`, `Banco`, `Tabela`, `Prazo`, `Observação`.
- `Banco` adicionado/validado como obrigatório em toda a cadeia (UI, API, serviço e banco).
- `CommissionTable` atualizado com propriedade `bank`.
- Migration criada para `commission_tables.bank` com `NOT NULL`:
  - `supabase/migration-2026-04-07-commission-table-bank-required.sql`
- Listagem de tabelas padronizada na ordem:
  - `Produto | Banco | Tabela | Prazo | Observação`

### Palavras-chave

- banco obrigatorio tabela comissao
- layout em linha produto banco tabela prazo observacao
- migration commission_tables bank

## 2026-04-07 - Lista de bancos atualizada via internet no campo Banco

- Campo `Banco` da criação de tabela passou a carregar lista atualizada de bancos do Brasil via `https://brasilapi.com.br/api/banks/v1`.
- Implementado `input` com `datalist` para seleção rápida + digitação manual.
- Fallback local com bancos principais para manter operação mesmo sem internet/endpoint indisponível.
- `Banco` permanece obrigatório no formulário e no backend.

### Palavras-chave

- brasilapi banks v1 credilix
- datalist bancos brasil campo banco
- fallback lista bancos

## 2026-04-07 - Campo Banco convertido para select pesquisável

- Campo `Banco` atualizado de `datalist` para `select` pesquisável (busca + seleção filtrada).
- Busca em tempo real por código/nome, com `filteredBankOptions` no frontend.
- Seleção continua obrigatória para manter qualidade de dados no cadastro da tabela.

### Palavras-chave

- select pesquisavel bancos
- banco busca por codigo nome
- filteredBankOptions credilix

## 2026-04-07 - Modo escuro com troca de logo

- Implementado tema escuro com toggle no header.
- Tema persistido em `localStorage` e aplicado via `body[data-theme]`.
- No modo escuro, a logo passa a usar:
  - `file:///D:/Site%20Credilix/dist/logo-credilix-light.png`
- Ajustadas variáveis de cor e fundo para experiência dark consistente.

### Palavras-chave

- dark mode credilix acessos
- theme toggle localstorage
- logo-credilix-light modo escuro
