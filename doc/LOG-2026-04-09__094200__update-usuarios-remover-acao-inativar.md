# LOG — Usuários: remoção da ação Inativar

## Contexto

A ação `Inativar` foi considerada redundante em relação à ação `Bloquear`.

## Alteração

- Na coluna `Ação` da tabela de usuários, removido o botão de `Inativar`.
- Mantidas as ações:
  - Editar
  - Resetar
  - Bloquear (vermelho)
- Removido import `UserMinus` não utilizado no frontend.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `cd web && npm run build` — OK.
- Sem erros de lint.

## Palavras-chave

- remover botao inativar
- manter bloquear vermelho
- users actions simplificacao
