# LOG: publicação FTP (paridade Waba) + domínio acessos.credilixpromotora.com.br

## Pedido

Trabalhar na publicação do sistema, usando os **parâmetros e logs** do deploy do projeto **Waba**; domínio registado: **https://acessos.credilixpromotora.com.br/**

## Contexto

- No Waba: workflow `.github/workflows/deploy-ftp.yml`, secrets `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_REMOTE_DIR`, comando `npm run bundle:ftp` e pasta `ftp-bundle/` (ver `doc/deploy-ftp-github.md` no repositório Waba).
- O domínio dos acessos mostrava listagem **Index of /** (LiteSpeed), típico de raiz sem app servida ou sem Node a responder.

## Solução

1. **`scripts/prepare-ftp-bundle.mjs`** — `tsc` + build Vite em `web/`, cópia de `dist/`, `web/dist/`, `public/branding/`, `uploads/` vazio, `npm ci --omit=dev` dentro de `ftp-bundle/`, `LEIA-ME.txt` com URL de produção e variáveis.
2. **`package.json`** — scripts `bundle:ftp` e `start:prod`.
3. **`.github/workflows/deploy-ftp.yml`** — mesmo action `SamKirkland/FTP-Deploy-Action@v4.3.6`; push em `master` e `main`; passo que corre `npm ci` em raiz e `web/` antes do bundle.
4. **`doc/deploy-ftp-github.md`** — tabela de secrets, domínio, nota sobre Node obrigatório após FTP.
5. **`README.md`** — secção “Publicação em produção”.
6. **`.gitignore`** — `ftp-bundle/`.

## Ficheiros criados/alterados

- `scripts/prepare-ftp-bundle.mjs` (novo)
- `.github/workflows/deploy-ftp.yml` (novo)
- `doc/deploy-ftp-github.md` (novo)
- `doc/LOG-2026-04-13__171000__feat-deploy-ftp-paridade-waba-acessos-dominio.md`
- `package.json`, `README.md`, `.gitignore`

## Validação

- `npm run bundle:ftp` em `D:\Credilix-acessos` — concluiu com `OK → pasta: ...\ftp-bundle`.

## Segurança

- Credenciais apenas em GitHub Secrets e `.env` no servidor; nada disso foi commitado.

## Palavras-chave

- deploy ftp credilix acessos
- FTP_HOST FTP_REMOTE_DIR acessos.credilixpromotora.com.br
- bundle:ftp paridade waba
