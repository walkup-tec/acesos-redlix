# LOG — Conteúdos: modal de upload no modo claro

## Contexto

No tema claro, o modal "Nome do arquivo" estava com visual escuro (fundo, input e botões), causando baixo contraste e inconsistência com a tela clara.

## Ações executadas

- Ajustado `web/src/index.css` com overrides de `body[data-theme="light"]` para o modal de conteúdo:
  - Backdrop mais suave para o tema claro.
  - Cartão do modal com fundo claro, borda roxa suave e sombra adequada.
  - Título do modal com `var(--brand-fg)`.
  - Botão fechar com contraste melhor no claro.
  - Input com fundo branco e texto escuro.
  - Botão `Cancelar` (`.btn-ghost` no contexto do modal) com borda/cor legíveis e hover consistente.
- Mantido o comportamento existente do modo escuro (sem regressão visual no dark).

## Arquivos alterados

- `web/src/index.css`

## Validação

- `cd web && npm run build` (ok, exit code 0)

## Segurança

- Mudança apenas de CSS, sem exposição de segredos.

## Palavras-chave

- conteudos modal modo claro
- content-modal light theme
- upload nome do arquivo contraste
