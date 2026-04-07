# LOG: Fluxo unificado de Produto + Comissão na mesma tela

## Contexto

Solicitação: tornar o fluxo mais fluido no cadastro de produto, criando produto e já adicionando os dados da tabela de comissão sem trocar de módulo.

## Solução aplicada

1. **Módulo único**
   - Removido o módulo separado de `Tabelas` no frontend.
   - `ModuleKey` ficou: `users`, `products`, `contents`.

2. **Fluxo unificado**
   - No módulo `Produtos`, o card da esquerda virou:
     - campo `Nome do produto`
     - campos da tabela inicial (`Nome da tabela`, `Prazo`, `Comissão %`) quando o usuário possui permissão de comissão.
   - Submit único (`handleCreateProduct`):
     1. cria o produto (`POST /api/products`)
     2. cria a tabela com o `productId` recém-criado (`POST /api/commission-tables`)

3. **Visualização consolidada**
   - Na direita da mesma tela, o usuário vê:
     - lista de produtos
     - tabela com comissões já cadastradas

## Arquivos alterados

- `web/src/App.tsx`

## Build/validação executada

- `npm run build --prefix web`
- `npm run build:web`

## Segurança e consistência

- Mantidas validações de permissão existentes do backend (`createCommissionTable`).
- Sem exposição de segredos.

## Palavras-chave

- fluxo produto comissao unificado
- cadastro produto tabela inicial
- remover modulo tabelas frontend
