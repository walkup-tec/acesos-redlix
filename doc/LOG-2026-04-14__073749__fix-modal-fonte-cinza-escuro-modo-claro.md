# LOG: modal com fonte cinza escuro no modo claro

## Contexto

Solicitado aumentar contraste da fonte do modal no modo claro, mantendo o modo escuro sem alterações.

## Solução implementada

- web/src/index.css
  - ody[data-theme="light"] .modal-dialog { color: #3b3344; }
  - ody[data-theme="light"] .modal-dialog__title { color: #2f2438; }
  - ody[data-theme="light"] .modal-dialog .muted { color: #51475f; }
- Nenhuma alteração específica em ody[data-theme="dark"].

## Arquivo alterado

- web/src/index.css

## Validação

- 
pm run build --prefix web executado com sucesso.

## Palavras-chave

- modal fonte cinza escuro
- modo claro contraste modal
