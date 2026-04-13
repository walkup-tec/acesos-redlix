# LOG: Nixpacks Node 20 (Easypanel / Vite 8)

## Contexto

Build no Easypanel com Nixpacks 1.41 usava **Node 18**; `vite build` falhou: requer Node **20.19+** (`CustomEvent is not defined` no CLI do Vite em Node 18).

## Solução

- `nixpacks.toml` na raiz: `[phases.setup]` com `nixPkgs = ["nodejs_20", "npm-10_x"]`.
- `package.json`: `engines.node` `>=20.19.0` para alinhar com o ecossistema.

## Ficheiros

- `nixpacks.toml` (novo)
- `package.json`

## Validação

- Novo deploy no Easypanel após `git push` em `main`; build deve passar a fase `web` (`vite build`).

## Segurança

- Logs de build que incluam `docker buildx ... --build-arg` podem expor segredos; preferir variáveis só em runtime no painel e rodar chaves se vazaram.

## Palavras-chave

- nixpacks nodejs_20 easypanel vite 8
