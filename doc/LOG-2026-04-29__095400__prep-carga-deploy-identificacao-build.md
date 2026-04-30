# LOG: preparo de nova carga de deploy para teste de identificação

## Contexto

Solicitado preparar uma nova carga de deploy para validar identificação de build em produção.

## Ações executadas

- Build completo atualizado:
  - `npm run build`
  - `npm run build:web`
- Coletado hash curto do commit atual:
  - `git rev-parse --short HEAD` -> `57efb9c`
- Atualizado `.env.example` com variáveis de identificação de deploy:
  - `APP_BUILD_LABEL`
  - `APP_BUILD_COMMIT`
  - `APP_BUILD_DEPLOYED_AT`

## Resultado

- Artefatos de build prontos (`dist/` e `web/dist/`).
- Projeto preparado para implantação no EasyPanel com rastreabilidade de versão.

## Como validar após implantar

- `GET /api/build`
- `GET /api/health` (campo `build`)

## Palavras-chave

- carga deploy
- identificacao build
- easypanel metadata
