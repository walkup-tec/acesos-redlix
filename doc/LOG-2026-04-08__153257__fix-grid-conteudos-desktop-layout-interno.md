# LOG - Correção de grid desktop e layout interno de conteúdos

## Contexto do pedido

A tela interna de conteúdos estava com grid quebrado no desktop (card estreito e layout diferente do mock esperado).

## Ações executadas

- Corrigida a responsividade desktop do módulo `Conteúdos` para não herdar a grade de duas colunas do layout geral.
- Mantida estrutura Bootstrap do card principal (`col-12 col-xl-10`) com área efetiva correta.
- Ajustado visual dos botões `Adicionar PDF` e `Adicionar Imagem` para o estilo roxo do layout.
- Removido botão `Voltar` do topo do painel interno para alinhamento com o mock.
- Corrigido nome exibido do arquivo para não mostrar caminho completo em Windows (`\`), usando basename real.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Comandos executados

- `npm run build:web`

## Como validar

1. Abrir `Conteúdos` em desktop.
2. Entrar em uma pasta.
3. Verificar card interno largo (não comprimido), alinhado com o mock.
4. Conferir botões de adicionar com estilo roxo.
5. Conferir que o nome do arquivo não mostra o path completo.

## Observações de segurança

- Mudanças restritas à camada de UI/layout.
- Nenhum segredo ou token exposto.

## Palavras-chave

- fix grid desktop conteudos
- layout interno pasta
- basename arquivo windows
