# LOG — Padronização de botões Salvar/Incluir em verde translúcido

## Contexto

Solicitado que todos os botões de `Salvar`/`Incluir` do sistema usem padrão verde com transparência, coerente com o layout atual.

## Implementação

- Em `web/src/index.css`:
  - aplicado estilo global para `button[type="submit"]` em verde translúcido no modo claro;
  - aplicado hover correspondente (tom mais forte, mantendo transparência);
  - aplicado estilo equivalente para modo escuro;
  - ajustado `content-modal__confirm` para o mesmo padrão translúcido verde (claro e dark).

## Observação

- Mantidas cores originais de botões não-submit (ex.: `theme-toggle`, `shell-refresh`), para não alterar controles globais fora do escopo de salvar/incluir.

## Arquivo alterado

- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Lint sem erros.

## Palavras-chave

- submit green translucent
- salvar incluir cor verde
- content modal confirm green glass
