# LOG: melhoria de contraste de texto nos modais

## Contexto

No modo claro, texto em modais de confirmação (exclusão/ações) estava com contraste baixo e pouca legibilidade.

## Solução implementada

- `web/src/index.css`
  - `modal-dialog` passou a herdar `color: var(--brand-fg)`.
  - `modal-dialog__title` forçado com `color: var(--brand-fg)`.
  - `.modal-dialog .muted` ajustado com mix de cor para aumentar contraste sem perder hierarquia visual.
  - Ajuste equivalente para tema escuro em `body[data-theme="dark"] .modal-dialog .muted`.

## Arquivo alterado

- `web/src/index.css`

## Validação

- `npm run build --prefix web` concluído com sucesso.

## Palavras-chave

- modal texto pouco visivel
- contraste fonte modal claro
