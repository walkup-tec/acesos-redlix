# LOG: Usuários — mobile toolbar alinhamento (ref. visual) + altura select = botão

## Contexto

A toolbar mobile (título → Atualizar → filtro → pesquisa) ainda não batia com o alinhamento desejado: select em largura total e alturas diferentes no WebKit.

## Ajustes

1. **Select sem `width: 100%` no mobile** — `width: auto`, `min-width: min(10.5rem, 100%)`, como o botão à esquerda (referência: campo de pesquisa mais largo que filtro/botão).
2. **Bloco `@media (max-width: 900px)` no fim de `index.css`** (depois de `.btn-secondary`) com:
   - `height` / `min-height` / `max-height` **2.5rem** iguais para botão e select;
   - select com **`-webkit-appearance: none`** + **seta SVG** em `background-image` (iOS respeita altura fixa melhor que o select nativo);
   - `background-color` separado (claro / escuro);
   - input de pesquisa com **`min-height: 2.5rem`** para alinhar ritmo vertical com os controles acima.

## Arquivos

- `web/src/index.css`

## Validação

`npm run build` em `web/`. Testar em Safari iPhone claro e escuro.
