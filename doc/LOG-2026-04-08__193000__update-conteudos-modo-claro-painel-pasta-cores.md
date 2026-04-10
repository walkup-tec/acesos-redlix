# LOG — Conteúdos: cores no modo claro ao abrir pasta

## Contexto

No módulo **Conteúdos**, ao abrir uma pasta, o painel (`.content-inside-panel`) usava fundo escuro fixo enquanto o texto seguia a cor do body no tema claro, gerando baixo contraste. O título da página (`.contents-toolbar__title`) estava em branco fixo. Botões e lista de ficheiros herdavam estilos pensados para fundo escuro.

## Ações

- Ajustes em `web/src/index.css` com seletores `body[data-theme="light"]`:
  - Título **Conteúdos**: `color: var(--brand-fg)`.
  - Painel interno da pasta: fundo/borda/sombra alinhados ao cartão claro (`var(--card-bg)`, `var(--glass-border)`).
  - `h4` e parágrafo de meta com cores de texto claras legíveis.
  - Botões **Adicionar PDF / Imagem** (`.btn-secondary` dentro do painel): fundo claro, texto roxo escuro, hover com sombra suave.
  - Ícones de ficheiro e botão eliminar: cores adequadas a fundo claro.
  - Links dos nomes de ficheiro: roxo escuro (`#5b21b6` / hover `#4c1d95`).

## Ficheiros alterados

- `web/src/index.css`

## Validação

- `cd web && npm run build` — concluído sem erros.

## Segurança

- Apenas CSS; sem segredos.

## Palavras-chave

- conteudos modo claro painel pasta
- content-inside-panel light theme contraste
