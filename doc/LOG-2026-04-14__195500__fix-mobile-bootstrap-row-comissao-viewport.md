# LOG: mobile — Tabela de Comissão fora da view (Bootstrap `.row`)

## Contexto

No iPhone (Safari), a tela **Tabela de Comissão** aparecia deslocada (conteúdo cortado à esquerda ou folga à direita) e com sensação de scroll horizontal na página.

## Causa

O módulo de produtos/comissão usa **Bootstrap 5** (`row`, `col-*`) diretamente dentro de `.shell-body`, **sem** `.container`. A classe `.row` aplica **margens horizontais negativas** para alinhar colunas com o padding do container; sem esse container, o bloco **ultrapassa** a largura útil do `main` já paddingado.

## Solução

Em `web/src/index.css`, dentro de `@media (max-width: 900px)`:

- `.shell-body .row { margin-left: 0; margin-right: 0; }` — neutraliza o overflow lateral.
- `.shell-body .row > [class*="col"] { max-width: 100%; min-width: 0; }` — evita colunas flex que empurram a largura.
- `.products-filters { grid-template-columns: 1fr; }` — filtros em coluna única no mobile (evita `minmax(180px, …)` apertado).

## Arquivos alterados

- `web/src/index.css`

## Como validar

1. `npm run build` em `web/`.
2. iPhone ou DevTools &lt; 901px: abrir **Tabela de Comissão**; header, card do formulário e lista devem alinhar com o padding de `.shell-body`, sem “arrastar” a página no eixo X (tabelas largas seguem com scroll só em `.table-wrap`).

## Palavras-chave

- bootstrap row margin negativo mobile
- shell-body sem container
- credilix comissão viewport
