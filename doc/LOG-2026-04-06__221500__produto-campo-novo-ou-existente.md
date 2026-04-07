# LOG: Campo de produto com opção novo ou existente

## Contexto

Nova alteração de UX no fluxo unificado de produto/comissão:
- o campo de produto deve permitir:
  1) adicionar nome novo
  2) selecionar nome já criado

## Implementação

- `web/src/App.tsx`:
  - Novo estado `productSelectionMode` (`new` | `existing`).
  - Novo estado `selectedProductId` para quando usar produto existente.
  - No formulário:
    - select `Origem do produto` com:
      - `Adicionar nome novo`
      - `Selecionar nome já criado`
    - campo `Nome do produto` vira:
      - `input` quando `new`
      - `select` com produtos existentes quando `existing`
  - `handleCreateProduct`:
    - se `new`, cria produto e usa o `id` retornado;
    - se `existing`, usa `selectedProductId`;
    - em ambos, cria tabela de comissão com esse `productId` quando há permissão.
  - Rótulo do botão muda dinamicamente:
    - `Criar produto e tabela`
    - `Adicionar tabela ao produto`

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `npm run build --prefix web` ✅
- `npm run build:web` ✅

## Palavras-chave

- produto novo ou existente
- productSelectionMode
- adicionar tabela ao produto existente
