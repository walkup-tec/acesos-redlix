# LOG - 2026-04-10 06:56:40 - update perfil vendedor menu somente leitura

## Contexto do pedido

Definir o perfil `VENDEDOR` para visualizar apenas `Tabela de Comissao` e `Conteudos`, sem permissoes de edicao/exclusao, mantendo menu de tema escuro e atualizar.

## Acoes executadas

- Leitura e validacao da logica de permissoes no frontend (`web/src/App.tsx`).
- Ajuste do filtro de modulos exibidos no menu lateral.
- Ajuste de redirecionamento automatico quando modulo ativo nao for permitido.
- Build de validacao:
  - `npm run build:web`
- Verificacao de lint:
  - `ReadLints` em `web/src/App.tsx`

## Solucao implementada

1. Mantida a logica de edicao:
   - sem `permCommissionTables` => usuario nao ve formulario de criacao/edicao de tabela;
   - sem `permContents` => usuario nao ve botoes de upload/excluir em conteudos.
2. Ajustado menu lateral para nao exibir `Usuarios` para perfil sem permissao de gestao.
3. Garantido que o sistema reposiciona para o primeiro modulo permitido caso o ativo nao seja autorizado.
4. Mantidos os atalhos utilitarios de tema e atualizar na lateral.

## Arquivos alterados

- `web/src/App.tsx`
- `doc/LOG-2026-04-10__065640__update-perfil-vendedor-menu-somente-leitura.md`

## Como validar

1. Login com usuario `VENDEDOR`.
2. Confirmar que menu lateral exibe somente:
   - `Tabela de Comissao`
   - `Conteudos`
3. Confirmar que nao ha opcoes de criar/editar/excluir nesses modulos.
4. Confirmar que botoes de tema (escuro) e atualizar continuam disponiveis.

## Observacoes de seguranca

- Alteracao somente de frontend (visibilidade/UX).
- Permissoes de backend permanecem como camada de seguranca efetiva.

## Palavras-chave

- perfil vendedor somente leitura
- menu lateral por permissao
- tabela comissao visualizar
- conteudos visualizar
