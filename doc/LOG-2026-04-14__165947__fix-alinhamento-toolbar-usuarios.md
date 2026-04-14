# LOG: ajuste de alinhamento no toolbar de usuários

## Contexto

Solicitado ajuste de layout:
- remover título "Status" do filtro;
- input de pesquisa abaixo do título e alinhado à esquerda;
- filtro e botão atualizar no lado direito, lado a lado.

## Solução aplicada

### `web/src/App.tsx`
- Removido o label textual `Status` acima do select de filtro.

### `web/src/index.css`
- Removida classe de label de status não utilizada.
- `users-toolbar__search-row` alterado para alinhar à esquerda (`justify-content: flex-start`).
- Mantido bloco da direita com filtro + atualizar lado a lado em `card-toolbar__actions`.

## Validação

- `npm run build --prefix web` (OK)
- Sem erros de lint nos arquivos alterados.

## Palavras-chave

- alinhamento toolbar usuarios
- remover label status
- pesquisa esquerda filtro direita
