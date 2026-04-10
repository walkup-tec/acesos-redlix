# LOG — Fix: modal de edição fechando ao clicar em campos

## Contexto

Ao clicar em campos do modal de edição de usuário, o modal estava fechando indevidamente.

## Causa provável

`onClick` no backdrop fechava o modal sem validar se o clique realmente aconteceu fora do conteúdo.

## Correção aplicada

- Em todos os modais de ações de usuário (`EDIT`, `RESET`, `INACTIVE/BLOCKED`), o fechamento por clique externo agora ocorre somente quando:

```ts
if (e.target === e.currentTarget) closeUserActionModal();
```

- Assim, cliques dentro do conteúdo (inputs/select/botões) não acionam fechamento.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `cd web && npm run build` — OK.
- Lint sem erros.

## Palavras-chave

- modal fecha ao clicar input
- backdrop click guard
- edit user modal close fix
