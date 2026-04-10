# LOG — Redução do botão Incluir (Tabela de Comissão)

## Contexto

Após ajuste anterior, o botão **Incluir** ainda estava visualmente alto no card de criação de tabela.

## Ações

- Em `web/src/index.css`, no seletor `.commission-table-create-form button[type="submit"]`:
  - reduzido `padding` para `0.35rem 0.75rem`;
  - aplicada altura fixa `2.15rem` (`height` e `max-height`);
  - reduzido `font-size` para `0.86rem` e `line-height: 1`;
  - trocado `align-self: stretch` por `align-self: start` para impedir esticamento vertical no grid.

## Arquivos alterados

- `web/src/index.css`

## Validação

- `cd web && npm run build` (ok, exit code 0)

## Palavras-chave

- incluir botao alto
- commission-table-create-form submit height
