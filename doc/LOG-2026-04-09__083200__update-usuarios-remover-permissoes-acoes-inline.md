# LOG — Usuários: remover coluna Permissões e ações diretas por linha

## Contexto

Solicitação para:

- Remover a coluna `Permissões` da tabela de usuários.
- Na coluna `Ação`, exibir botões diretos (um por ação), com cores no padrão do sistema.

## Alterações

- `web/src/App.tsx`
  - Removida coluna `Permissões` no cabeçalho e no corpo da tabela.
  - Coluna `Ação` agora renderiza 4 botões por usuário:
    - `Editar`
    - `Reset`
    - `Inativar`
    - `Bloquear`
  - Removido fluxo intermediário de modal de seleção de ações.

- `web/src/index.css`
  - Novo layout de botões em grade (`.user-actions-inline`) dentro da célula de ação.
  - Botões com classe `.user-inline-btn` usando estilo alinhado ao sistema (incluindo modo dark).

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Sem erros de lint nos arquivos alterados.

## Palavras-chave

- remover coluna permissoes
- usuarios botoes de acao por linha
- user actions inline buttons
