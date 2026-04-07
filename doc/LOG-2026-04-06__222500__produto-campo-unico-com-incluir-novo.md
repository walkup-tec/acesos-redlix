# LOG: Produto em campo único com opção "Incluir novo"

## Contexto

Ajuste de UX solicitado: o cadastro de produto/tabela deve usar um único campo estilo select, contendo também a opção para incluir novo item na mesma lista.

## Implementação

- `web/src/App.tsx`
  - Removido o seletor separado de origem (`novo`/`existente`).
  - Campo único `Nome do produto` agora é um `select` com:
    - `Incluir novo` (opção especial)
    - produtos já cadastrados
  - Quando `Incluir novo` está selecionado, exibe input abaixo para digitar o nome do novo produto.
  - Submit:
    - se `Incluir novo`, cria produto e usa o `id` retornado;
    - se produto existente, usa o `id` selecionado;
    - segue criando a tabela de comissão com o mesmo fluxo.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `npm run build --prefix web` ✅
- `npm run build:web` ✅

## Palavras-chave

- select incluir novo
- campo único produto
- produto existente ou novo
