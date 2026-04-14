# LOG: ajuste visual do botão Atualizar em usuários

## Contexto

Solicitado reduzir tamanho do botão `Atualizar` e melhorar background, mantendo padrão visual já usado em botões do sistema.

## Ajustes aplicados

- Arquivo: `web/src/index.css`
- Classe: `.card-toolbar__action-btn`
- Melhorias:
  - botão menor (padding e fonte reduzidos)
  - visual com fundo/contorno azul no padrão dos botões de ação existentes
  - hover mais consistente (sem sombra exagerada)
  - ajustes para modo escuro e estado desabilitado

## Validação

- `npm run build --prefix web` (OK)
- Sem erros de lint no arquivo alterado.

## Palavras-chave

- botao atualizar menor
- card-toolbar action button
- padrao visual botoes
