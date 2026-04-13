# Deploy Git → FTP (GitHub Actions) — Credilix Acessos

Alinhado ao fluxo do projeto **Waba** (`npm run bundle:ftp`, pasta `ftp-bundle/`, workflow `Deploy FTP (bundle)`). No Waba, a documentação equivalente está em `doc/deploy-ftp-github.md` e logs em `doc/LOG-2026-04-02__183000__git-push-deploy-ftp-cmd-system32.md` (push em `master`, secrets, evitar `System32` ao correr git).

## Domínio de produção

- URL pública: **https://acessos.credilixpromotora.com.br/**
- Após o deploy de ficheiros, o painel só responde se o **Node.js** estiver a servir `node dist/server.js` (ou equivalente com PM2/systemd). Um diretório vazio no LiteSpeed mostra só **Index of /** até existir `index.html` na raiz **e** um servidor a tratar `/` e `/api`, ou até configurar **proxy reverso** para a porta do Node.

## Segurança

- **Nunca** commite `.env` nem credenciais FTP.
- Use **GitHub → Settings → Secrets and variables → Actions → New repository secret**.

## Secrets obrigatórios (repositório GitHub)

| Secret | Exemplo | Descrição |
|--------|---------|-----------|
| `FTP_HOST` | `ftp.acessos.credilixpromotora.com.br` ou IP | Host FTP do painel (Hostinger/cPanel/etc.) |
| `FTP_USERNAME` | utilizador FTP | |
| `FTP_PASSWORD` | palavra-passe | |
| `FTP_REMOTE_DIR` | `/public_html` | Pasta **remota** onde o site deve ficar (confirmar no painel: pode ser `public_html`, `domains/.../public_html`, `/www`, etc.) |

## Quando roda o workflow

- **Push** em `master` ou `main`.
- Manual: **Actions** → **Deploy FTP (bundle)** → **Run workflow**.

## O que o CI faz

1. `npm ci` na raiz e em `web/`.
2. `npm run bundle:ftp` → gera `ftp-bundle/` com `dist/`, `web/dist/`, `public/branding/`, `uploads/`, `node_modules` (produção) e `LEIA-ME.txt`.
3. Envia o conteúdo de `ftp-bundle/` para `FTP_REMOTE_DIR` via [FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action).

## Após o FTP (obrigatório no servidor)

1. Criar **`.env`** na pasta onde ficou o `package.json` (mesmo nível que `dist/`), **não** commitado.
2. Ajustar pelo menos:
   - `APP_BASE_URL=https://acessos.credilixpromotora.com.br`
   - `PORT` — se o alojamento definir a porta automaticamente (Passenger, etc.), use essa variável; caso contrário defina a porta exposta atrás do proxy.
   - `JWT_SECRET`, `SUPABASE_*`, e-mail (`MAIL_MODE=smtp`, `SMTP_*`, `MAIL_FROM`).
3. Arrancar o processo Node (ex.: `node dist/server.js` ou PM2). Sem isto, o site continua sem API e sem SPA.

## Build da UI e API

- Em produção, com a API e a UI no mesmo domínio, mantenha **`VITE_API_BASE_URL` vazio** no build (como em `web/.env.example`), para os pedidos irem para a mesma origem.

## FTPS / porta custom

Edite `.github/workflows/deploy-ftp.yml` no passo **Enviar para FTP** e acrescente `protocol` / `port` conforme a documentação da action.

## Referência cruzada (Waba)

- Workflow: `bundle:ftp` + `SamKirkland/FTP-Deploy-Action@v4.3.6`.
- Regra Cursor “sobe para o servidor”: commit + push para disparar o deploy.
