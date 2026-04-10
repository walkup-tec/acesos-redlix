# LOG - 2026-04-10 09:33:19 - feat acoes editar excluir tabelas comissao

## Contexto do pedido

Adicionar botoes de edicao e exclusao:
- por tabela individual (linha);
- por card pai do produto (acoes do conjunto de tabelas daquele produto).

## Solucao implementada

### Backend

- Novos servicos:
  - `updateCommissionTable(...)`
  - `deleteCommissionTable(...)`
  - `deleteCommissionTablesByProduct(...)`
  - `updateProductName(...)`
- Novas rotas:
  - `PATCH /api/commission-tables/:id`
  - `DELETE /api/commission-tables/:id`
  - `DELETE /api/commission-tables/by-product/:productId`
  - `PATCH /api/products/:id`

### Frontend

- Card pai do produto agora possui acoes:
  - editar nome do produto;
  - excluir todas as tabelas do produto.
- Cada linha da tabela ganhou coluna `Ações` com:
  - editar tabela;
  - excluir tabela.
- Fluxo usa prompts/confirmacoes para edicao/exclusao e atualiza lista via `refreshAll()`.

## Arquivos alterados

- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`
- `web/src/index.css`
- `doc/LOG-2026-04-10__093319__feat-acoes-editar-excluir-tabelas-comissao.md`

## Validacao executada

- `npm run build`
- `npm run build:web`
- `ReadLints` nos arquivos alterados (sem erros)

## Observacoes de seguranca

- Acoes protegidas por autenticacao e permissao (`assertCanEditCommissionTables`).
- Nenhum segredo exposto.

## Palavras-chave

- editar tabela comissao
- excluir tabela comissao
- excluir tabelas por produto
- editar nome produto card pai
