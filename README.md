# Credilix Acessos - Piloto

API piloto para gestão de acessos e conteúdos (imagens, PDFs e tabelas de comissão) em modelo multi-tenant.
Persistência exclusiva em Supabase (Postgres).

## Local (só isso)

1. `cd D:\Credilix-acessos`
2. `npm install` e `cd web && npm install && cd ..` (uma vez)
3. `npm run dev:ui`
4. Abrir **http://127.0.0.1:5050/** — login: `master@credilix.local` / `Master@123`  
   Teste rápido: **http://127.0.0.1:5050/api/health** → deve ter `"service":"credilix-acessos"`.

Os scripts `dev` / `dev:ui` **fixam PORT=5050** (ignora `PORT` do Windows).

## Requisitos atendidos no piloto

- Convite de usuário por master/autorizado.
- Finalização de cadastro com envio de documentos.
- Aprovação manual do cadastro.
- Código de validação no primeiro acesso.
- Login, esqueci senha e redefinição.
- Cadastro de produtos.
- Cadastro/listagem de tabelas de comissão por produto.
- Upload/listagem de conteúdos por tenant.

## Rodando local

1. Crie um projeto Supabase exclusivo para este sistema.
2. Execute o SQL base em `supabase/schema.sql` no SQL Editor do Supabase.
3. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Instale dependências:
   - `npm install`
5. Instale dependências do frontend:
   - `cd web && npm install && cd ..`
6. Gere o build da UI e suba a API (tudo em **http://127.0.0.1:5050**):
   - `npm run dev:ui`  
   Ou, após mudanças só no backend: `npm run dev` (a UI só atualiza se você rodar `npm run build:web` de novo).
7. Abra no navegador: **http://127.0.0.1:5050/** (login + painel).

## Usuário inicial (seed)

- E-mail: `master@credilix.local`
- Senha: `Master@123`

## Páginas públicas (cadastro e ativação)

- **`/convite?token=...`** — link enviado por e-mail ao criar usuário; formulário de cadastro com documentos.
- **`/ativar`** — validar primeiro acesso (código de 6 dígitos), pedir código de recuperação de senha ou definir nova senha.

`APP_BASE_URL` no `.env` deve ser a URL **pública** do painel (HTTPS em produção), pois os e-mails usam esse valor nos links.

## E-mail (convite, aprovação, recuperação de senha)

1. Defina **`MAIL_MODE=smtp`** e preencha **`MAIL_FROM`**, **`SMTP_HOST`**, **`SMTP_PORT`**, **`SMTP_USER`**, **`SMTP_PASS`** (e **`SMTP_SECURE=true`** se usar porta 465).
2. Em desenvolvimento, **`MAIL_MODE=log`** imprime o conteúdo no console do Node (sem credenciais SMTP).
3. Opcional: **`DEBUG_EXPOSE_EMAIL_CODES=true`** só em dev para ver códigos na resposta JSON de aprovação (nunca em produção).

Funciona com qualquer SMTP (SendGrid, Amazon SES, Microsoft 365, provedor do domínio, etc.).

## Rotas principais

Todas as rotas REST estão sob o prefixo **`/api`** (a raiz **`/`** serve o painel React).

- `GET /api/health`
- `GET /api/branding`
- `GET /api/auth/me` (auth) — perfil e permissões a partir do banco (o painel depende desta rota)
- `GET /api/auth/invite-context?token=` (dados do convite para a tela `/convite`)
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-first-access`
- `POST /api/users/invite` (auth)
- `POST /api/users/:id/complete-registration` (multipart)
- `POST /api/users/:id/approve` (auth)
- `PATCH /api/users/:id/block` (auth)
- `POST /api/products` (auth)
- `GET /api/products` (auth)
- `POST /api/commission-tables` (auth)
- `GET /api/commission-tables` (auth)
- `POST /api/contents` (auth + multipart)
- `GET /api/contents` (auth)

## Identidade visual

- Paleta aplicada com base em `D:\Site Credilix\src\index.css`:
  - `primary`: `#86209A`
  - `secondary`: `#DF9E0C`
  - `accent`: `#F64F67`
  - `foreground`: `#2D1F35`
  - `background`: `#FCFCFC`
- Endpoint de branding: `GET /api/branding`
- Defina `BRANDING_LOGO_URL` no `.env` para a logo oficial.

## Observações

- Este backend não usa mais banco local.
- Arquivos enviados ainda ficam em `uploads/` (próximo passo: Supabase Storage).

## Porta local

Padrão do projeto: **5050** (evita conflito com outros serviços que usam **5000**).

- Painel: `http://127.0.0.1:5050/`
- Health: `http://127.0.0.1:5050/api/health` (deve incluir `"service":"credilix-acessos"`)

## Publicação em produção (FTP + Node)

Domínio alvo documentado: **https://acessos.credilixpromotora.com.br/**

1. **GitHub Actions** (mesmo modelo do projeto Waba): configure os secrets `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_REMOTE_DIR` e faça push em `master` ou `main`, ou execute o workflow manualmente. Ver **`doc/deploy-ftp-github.md`**.
2. Localmente pode gerar o pacote com **`npm run bundle:ftp`** (pastas `dist/`, `web/dist/` e dependências de produção dentro de **`ftp-bundle/`**).
3. **FTP só copia ficheiros** — no servidor é necessário **Node.js** a correr **`node dist/server.js`** (ou PM2/systemd) e um ficheiro **`.env`** com `APP_BASE_URL` em HTTPS. Alojamento só PHP/static sem Node não serve este projeto tal como está.

- Arranque em produção: `npm run start:prod` (após `npm run build && npm run build:web` no servidor) ou apenas `node dist/server.js` se o build já foi feito no CI/pacote.
