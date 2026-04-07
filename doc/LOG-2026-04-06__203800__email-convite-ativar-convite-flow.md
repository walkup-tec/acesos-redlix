# LOG: E-mail transacional, /convite, /ativar, JWT de convite

## Contexto

Disparo de e-mail ao criar usuário, aprovar cadastro e pedir recuperação de senha; páginas públicas para concluir cadastro e validar primeiro acesso.

## O que preciso que você configure (checklist)

1. **`APP_BASE_URL`** — URL pública do painel (ex.: `https://painel.credilix.com.br`), **sem barra no final**. Os links dos e-mails dependem disso.
2. **`MAIL_MODE=smtp`** em produção.
3. **`MAIL_FROM`** — endereço remetente autorizado no seu provedor (ex.: `Credilix <noreply@seudominio.com>`).
4. **SMTP** — `SMTP_HOST`, `SMTP_PORT` (587 com STARTTLS ou 465 com SSL), `SMTP_SECURE` (`true` só se porta 465), `SMTP_USER`, `SMTP_PASS`.
5. No provedor (SendGrid, SES, 365, cPanel, etc.): **SPF/DKIM** no domínio para boa entregabilidade.

Desenvolvimento: **`MAIL_MODE=log`** (padrão) — o convite aparece no console do Node.

## Implementação

- `src/mailer.ts` — Nodemailer; modos `off` | `log` | `smtp`.
- `src/auth.ts` — `signInviteToken` / `verifyInviteToken` (7 dias).
- `src/services.ts` — e-mails em `inviteUser`, `approveUser`, `forgotPassword`; `getInviteRegistrationContext`; `forgotPassword` não revela se o e-mail existe.
- `src/routes.ts` — `GET /api/auth/invite-context`; resposta de convite com `inviteLink`, `emailSent`, `emailError`; códigos de debug só com `DEBUG_EXPOSE_EMAIL_CODES`.
- `web/src/onboarding-ui.tsx` — `/convite`, `/ativar`; `web/src/App.tsx` — rotas públicas e aviso pós-criação de usuário.
- `README.md`, `.env.example`, dependência `@types/nodemailer`.

## Arquivos tocados

- `src/config.ts`, `src/auth.ts`, `src/mailer.ts`, `src/services.ts`, `src/routes.ts`
- `web/src/App.tsx`, `web/src/onboarding-ui.tsx`, `web/src/index.css`
- `package.json` / `package-lock.json`, `.env.example`, `README.md`

## Validar

1. `MAIL_MODE=log` — criar usuário e ver `[mail:log]` no terminal.
2. Abrir `{APP_BASE_URL}/convite?token=...` (token do log ou inspecionar resposta 201).
3. `/ativar` — fluxo de código após aprovação (e-mail ou `DEBUG_EXPOSE_EMAIL_CODES`).

## Palavras-chave

- MAIL_MODE smtp nodemailer
- invite-context convite token jwt
- APP_BASE_URL links email
