# LOG — Usuários: botão de ação com cor do sistema + menu em modal

## Contexto

O botão de ação (3 pontos) estava com cor fora do padrão visual e o menu aberto dentro da tabela causava barra de rolagem lateral ao expandir para baixo.

## Ajustes realizados

- Troca de interação de ação:
  - Removido dropdown inline (`.user-actions-menu`) dentro da célula da tabela.
  - Ao clicar no botão de 3 pontos, agora abre um **modal de ações** com:
    - Editar
    - Reset
    - Inativar
    - Bloquear
- Resultado: elimina overflow interno da tabela e a barra de rolagem lateral causada pelo menu contextual inline.

- Ajuste visual do botão de 3 pontos (`.user-actions-trigger`):
  - Fundo roxo suave (`rgba(139, 90, 158, 0.12)`).
  - Borda roxa compatível com o tema.
  - Ícone em roxo do sistema.
  - Hover com contraste e borda mais fortes, mantendo identidade visual.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Lint sem erros nos arquivos alterados.

## Palavras-chave

- users action button color
- dropdown overflow table
- user actions modal
