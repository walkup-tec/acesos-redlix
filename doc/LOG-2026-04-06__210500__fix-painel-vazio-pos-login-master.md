# LOG: Painel vazio após login (master) — correção

## Causa provável

1. **`session` sem permissões** enquanto o JWT estava correto → menu sem Tabelas/Conteúdos e regras de UI erradas se o objeto `user` do login viesse incompleto.
2. **`Promise.all` no carregamento** → uma única API falhando (ex.: tabelas) derrubava todo o refresh; listas ficavam vazias e só o erro agregado aparecia.
3. **Refresh da página** perdendo contexto: agora há **persistência** em `localStorage` + **reconstrução da sessão a partir do JWT** quando o objeto `user` não está salvo.

## Correções

- `resolvedSession`: `session` OU claims decodificadas do JWT (`sessionFromAccessToken`).
- `role` do master com comparação **case-insensitive** (`toUpperCase() === "MASTER"`).
- Login: `setSession(sessionFromAccessToken(token) ?? user)` (JWT como fonte de verdade das permissões).
- `refreshAll`: `Promise.allSettled` + mensagens por falha parcial; listas válidas ainda preenchem.
- `localStorage` chave `credilix_session` para `{ token, session }`; logout limpa.

## Arquivos

- `web/src/App.tsx`

## Validar

- Login master → deve listar usuários mesmo se outro endpoint falhar (aviso no banner).
- F5 com sessão ativa → deve manter menu completo para master.

## Palavras-chave

- resolvedSession jwt decode
- allSettled refreshAll
- credilix_session localStorage
