# LOG: correção de contraste no texto do modal de exclusão

## Contexto

Mesmo após ajustes em modais gerais, o modal de exclusão de tabela continuava com texto muito claro no modo claro.

## Causa raiz

A classe .content-modal__description tinha cor fixa clara (#e2e8f0), adequada ao fundo escuro, mas sem override no modo claro.

## Solução

- web/src/index.css
  - Adicionada regra específica:
    - ody[data-theme="light"] .content-modal__description { color: #4b5563; }

## Arquivo alterado

- web/src/index.css

## Validação

- 
pm run build --prefix web concluído com sucesso.

## Palavras-chave

- content-modal description light
- excluir tabela texto claro
