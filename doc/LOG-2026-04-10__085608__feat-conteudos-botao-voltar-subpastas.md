# LOG - 2026-04-10 08:56:08 - feat conteudos botao voltar subpastas

## Contexto do pedido

Foi solicitado um botao discreto para voltar um nivel quando o usuario estiver navegando em hierarquia de pastas (ex.: Pasta > Subpasta 1 > Subpasta 2 > Subpasta 3).

## Solucao implementada

- Adicionado botao `Voltar` no painel interno de Conteudos.
- O botao aparece apenas quando existe pasta atual (`currentFolderPath` preenchido).
- Ao clicar, sobe exatamente um nivel na hierarquia:
  - de `a/b/c` para `a/b`
  - de `a` para raiz.
- Botao aplicado nos dois estados do painel interno:
  - pasta com arquivos
  - pasta vazia.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`
- `doc/LOG-2026-04-10__085608__feat-conteudos-botao-voltar-subpastas.md`

## Validacao

- `npm run build:web` executado com sucesso.
- `ReadLints` sem erros.

## Palavras-chave

- botao voltar subpasta
- navegacao hierarquia pastas
- conteudos voltar nivel anterior
