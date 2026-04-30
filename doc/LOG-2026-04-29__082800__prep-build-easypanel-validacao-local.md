# LOG: preparação para build no EasyPanel

## Contexto

Solicitado deixar o projeto pronto para build/deploy no EasyPanel.

## Ações executadas

- Instalação de dependências:
  - `npm install`
  - `npm install --prefix web`
- Build de produção:
  - `npm run build`
  - `npm run build:web`
- Validação de execução de produção local:
  - `npm run start:prod`
  - Healthcheck em `http://127.0.0.1:5050/api/health`

## Resultado

- Build backend e frontend concluídos com sucesso.
- Entrypoint de produção `node dist/server.js` validado.
- Endpoint de health retornando:
  - `{"ok":true,"service":"credilix-acessos","features":{"inviteEmailBeforeDb":true}}`
- Supabase conectado com sucesso durante bootstrap.

## Observações para EasyPanel

- Runtime Node recomendado: `>=20.19.0`.
- Start command: `npm run start:prod` (ou `node dist/server.js`).
- Build command: `npm run build && npm run build:web`.
- Garantir variáveis obrigatórias no ambiente (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `APP_BASE_URL`).

## Segurança

- Nenhum segredo versionado em arquivo novo.
- Sem exposição de chaves no log.

## Palavras-chave

- easypanel build
- start prod node dist server
- credilix healthcheck
