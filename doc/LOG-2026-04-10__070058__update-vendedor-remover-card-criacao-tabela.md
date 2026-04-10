# LOG - 2026-04-10 07:00:58 - update vendedor remover card criacao tabela

## Contexto do pedido

No perfil `VENDEDOR`, o card de criacao de tabela de comissao ainda aparecia, apesar do perfil ser somente leitura.

## Acoes executadas

- Ajuste no render da tela `Tabela de Comissao` para esconder completamente o formulario de criacao quando nao houver permissao de edicao.
- Ajuste de largura da area de listagem para ocupar toda a linha quando o formulario estiver oculto.
- Build de validacao: `npm run build:web`.
- Verificacao de lint: `ReadLints` em `web/src/App.tsx`.

## Solucao implementada

1. Envolvido o `<form>` de criacao de tabela em condicao `canEditCommissionTables`.
2. Em modo somente leitura (ex.: vendedor), o card deixa de existir.
3. Lista/filtros de tabelas permanecem disponiveis para consulta.
4. Coluna da listagem passa para `col-12` quando sem card de criacao.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__070058__update-vendedor-remover-card-criacao-tabela.md`

## Como validar

1. Login com usuario `VENDEDOR`.
2. Abrir modulo `Tabela de Comissao`.
3. Confirmar que nao aparece o card com botao `Incluir`.
4. Confirmar que listagem/filtros de tabelas continuam visiveis.

## Palavras-chave

- vendedor sem card criar tabela
- comissao somente leitura
- canEditCommissionTables
