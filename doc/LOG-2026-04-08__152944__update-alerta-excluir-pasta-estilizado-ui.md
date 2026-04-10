# LOG - Alerta de exclusão de pasta estilizado na UI

## Contexto do pedido

Trocar o alerta nativo do navegador na exclusão de pasta por um alerta/modal próprio do sistema, mantendo o layout visual do painel.

## Ações executadas

- Removido `window.confirm` da ação de excluir pasta.
- Adicionado modal de confirmação na tela de conteúdos:
  - título;
  - descrição com nome da pasta;
  - botão `Cancelar`;
  - botão `Excluir pasta` com estilo de perigo.
- Adicionado botão `X` para fechar o modal.
- Mantida a mesma lógica de exclusão via endpoint já criado.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Como validar

1. Abrir módulo `Conteúdos`.
2. Clicar na lixeira de uma pasta.
3. Confirmar que aparece modal no layout do sistema (e não popup nativo).
4. Clicar em `Cancelar` para manter a pasta.
5. Clicar em `Excluir pasta` para remover.

## Observações de segurança

- A confirmação agora é controlada na UI (sem prompt nativo).
- Nenhum segredo exposto.

## Palavras-chave

- modal confirmacao excluir pasta
- alerta estilizado ui
- substituir window.confirm
