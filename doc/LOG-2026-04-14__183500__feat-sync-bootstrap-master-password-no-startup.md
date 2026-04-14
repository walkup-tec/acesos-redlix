# LOG: sincronizar senha do master com o .env em cada startup

## Contexto

O usuário master (`BOOTSTRAP_MASTER_EMAIL`) precisa poder fazer login com a senha definida em `BOOTSTRAP_MASTER_PASSWORD` no `.env`, mesmo quando o registro já existia no banco com hash antigo.

## Comportamento implementado

- Função `ensureBootstrapMaster` em `src/services.ts`.
- Se o master **já existe**: atualiza `password_hash` com bcrypt da senha atual do `.env`, zera `reset_code` e atualiza `updated_at`.
- Se **não existe**: mantém o fluxo anterior de `insert`.
- `BOOTSTRAP_MASTER_PASSWORD` não pode estar vazio (após `trim`).

## Observação de segurança operacional

Quem controla o `.env` controla a senha do master após cada restart. Manter `.env` restrito e segredo forte em produção.

## Arquivos

- `src/services.ts`
- `.env.example` (comentário explicativo)

## Validação

- `npm run build` (OK)

## Palavras-chave

- bootstrap master password sync
- ensureBootstrapMaster update hash
