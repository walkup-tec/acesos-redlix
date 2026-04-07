# Contexto do pedido

Usuário solicitou:

- Aplicar identidade visual conforme referência da pasta `D:\Site Credilix`.
- Utilizar um banco de dados novo no Supabase, exclusivo para este sistema.

# Comandos e ações executadas

- Leitura dos arquivos de estilo da referência:
  - `D:\Site Credilix\src\index.css`
  - `D:\Site Credilix\src\App.css`
  - `D:\Site Credilix\index.html`
- Instalação de dependência:
  - `npm install @supabase/supabase-js`
- Build de validação:
  - `npm run build`

# Solução implementada

1. Extraída paleta visual base da referência Credilix (cores HSL convertidas para hex).
2. Criada configuração central de branding no backend (`config.branding`), incluindo:
   - `name`
   - `logoUrl` (via env `BRANDING_LOGO_URL`)
   - `colors` (primary/secondary/accent/foreground/background)
3. Criado endpoint `GET /branding` para consumo do frontend.
4. Migrada persistência do backend para Supabase (exclusiva):
   - criado `src/supabase.ts` com client server-side (`SERVICE_ROLE`)
   - substituída lógica de dados local em `services.ts` por operações em tabelas Supabase
5. Criado schema SQL inicial em `supabase/schema.sql` com:
   - tabelas: `tenants`, `users`, `products`, `commission_tables`, `contents`
   - índices por `tenant_id`
   - RLS habilitado
6. Atualizado `.env.example` com variáveis obrigatórias do Supabase e branding.
7. Atualizado `README.md` com setup do Supabase e seção de identidade visual.

# Arquivos criados/alterados

- `src/config.ts`
- `src/supabase.ts`
- `src/services.ts`
- `src/routes.ts`
- `src/server.ts`
- `.env.example`
- `supabase/schema.sql`
- `README.md`
- `doc/LOG-2026-04-06__124612__update-supabase-exclusivo-e-identidade-visual-credilix.md`

# Como validar

1. Criar projeto Supabase novo e exclusivo.
2. Rodar `supabase/schema.sql` no SQL Editor.
3. Preencher `.env` com:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - opcionais de bootstrap e `BRANDING_LOGO_URL`
4. Rodar:
   - `npm install`
   - `npm run build`
   - `npm run dev`
5. Testar:
   - `GET /health`
   - `GET /branding`
   - fluxo de auth/cadastro/aprovação.

# Observações de segurança

- `SUPABASE_SERVICE_ROLE_KEY` permanece apenas no backend.
- Nenhuma chave sensível foi hardcoded no código fonte.
- RLS foi habilitado nas tabelas e deve receber policies específicas na etapa de produção.

# Itens para evitar duplicação no futuro (palavras-chave)

- credilix-branding
- supabase-exclusive-db
- multi-tenant-tenant-id
- schema-sql-inicial
- backend-auth-flow
