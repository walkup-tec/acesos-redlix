# LOG — fix erro ao criar tabela (fallback de banco)

## Contexto do pedido

Usuário reportou erro ao criar tabela de comissão, com banner indicando falha na criação de banco.

## Diagnóstico

- API registrou falhas em `GET /api/banks` (500) e `POST /api/banks` (400) no ambiente atual.
- O fluxo de criação de tabela dependia de criar banco antes (`/api/banks`) quando modo "novo banco" estava ativo.

## Solução aplicada

- Ajustado `web/src/App.tsx` no fluxo `handleCreateProduct`:
  - ao falhar `POST /api/banks`, o sistema entra em fallback (`banksApiUnavailable = true`);
  - usa o nome digitado do banco diretamente para criar a tabela;
  - persiste fallback em `localStorage` para manter comportamento compatível no ambiente atual.

## Validação executada

- Build do frontend concluído: `npm run build:web`.

## Arquivos alterados

- `web/src/App.tsx`

## Observações

- Esse ajuste evita bloqueio de operação até normalizar endpoint/schema de bancos no backend.

## Palavras-chave

- erro ao criar banco
- criar tabela comissao fallback
- banksApiUnavailable
