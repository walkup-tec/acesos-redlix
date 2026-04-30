# LOG: identificação de build/deploy na API

## Contexto

Necessidade de identificar claramente qual build está em produção para saber exatamente sobre o que foi feito o deploy.

## Ações executadas

1. Adicionados metadados de build na configuração (`src/config.ts`):
   - `APP_BUILD_LABEL`
   - `APP_BUILD_COMMIT`
   - `APP_BUILD_DEPLOYED_AT`
   - `appVersion` (via `npm_package_version`)
   - `startedAt` (timestamp de start do processo)

2. Exposição dos metadados na API (`src/routes.ts`):
   - `GET /api/health` agora inclui `build`
   - novo endpoint `GET /api/build`

3. Atualização da documentação (`README.md`):
   - referência aos endpoints de identificação
   - variáveis de ambiente para EasyPanel

## Validação

- Build backend executado com sucesso: `npm run build`.
- Sem erros de lint nos arquivos alterados.

## Arquivos alterados

- `src/config.ts`
- `src/routes.ts`
- `README.md`
- `doc/LOG-2026-04-29__094700__feat-identificacao-build-deploy-api.md`
- `doc/memoria.md`

## Segurança

- Metadados não expõem segredos; apenas identificação operacional de release.

## Palavras-chave

- identificacao build
- deploy metadata api
- health build version
