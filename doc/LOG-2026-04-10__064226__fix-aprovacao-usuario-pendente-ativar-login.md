# LOG - 2026-04-10 06:42:26 - fix aprovacao usuario pendente ativar login

## Contexto do pedido

Usuario concluiu cadastro via convite, mas nao conseguiu logar. O sistema retornava `Usuario nao esta ativo.` e o esperado era que Master/autorizado pudesse ativar o cadastro pendente para liberar login.

## Comandos e acoes executadas

- Verificacao de rotas e fluxo de status:
  - leitura de `src/routes.ts`, `src/services.ts`, `web/src/App.tsx`
- Build do frontend para validar alteracoes:
  - `npm run build:web`
- Validacao de lint nos arquivos alterados:
  - `ReadLints` em `web/src/App.tsx` e `web/src/index.css`

## Solucao implementada (passo a passo)

1. Confirmado que backend ja possui rota de aprovacao:
   - `POST /api/users/:id/approve`
   - rotina de servico muda status de `PENDING_APPROVAL` para `ACTIVE`.
2. Identificado gap no frontend: nao havia acao de aprovacao na tabela de usuarios.
3. Implementada nova acao `APPROVE` no `App.tsx`:
   - novo handler `handleApproveUser()`
   - chamada para endpoint `/api/users/:id/approve`
   - refresh da lista e mensagem de sucesso no painel.
4. Ajustada coluna de acoes:
   - quando status for `PENDING_APPROVAL`, exibe botao `Aprovar e ativar` (icone verde).
   - para demais status, mantem botao de bloqueio.
5. Adicionado modal de confirmacao de aprovacao.
6. Adicionados estilos light/dark para o novo botao de aprovacao em `index.css`.
7. Ajustada regra de exibicao de status no frontend:
   - antes: `ACTIVE` so aparecia como "Ativo" se `firstAccessVerifiedAt` existisse.
   - agora: qualquer `ACTIVE` aparece como "Ativo", alinhado ao fluxo de aprovacao manual do Master.

## Arquivos criados/alterados

- Alterado: `web/src/App.tsx`
- Alterado: `web/src/index.css`
- Alterado: `web/src/App.tsx` (regra visual de status)
- Criado: `doc/LOG-2026-04-10__064226__fix-aprovacao-usuario-pendente-ativar-login.md`

## Como validar

1. Rodar aplicacao e abrir painel de usuarios como Master.
2. Encontrar usuario com status `Pendente`.
3. Clicar no novo botao verde de `Aprovar e ativar`.
4. Confirmar no modal.
5. Verificar se o status muda para `Ativo`.
6. Tentar login com o usuario aprovado.

## Observacoes de seguranca

- Nenhum segredo foi exposto no codigo.
- Fluxo de aprovacao continua protegido por autenticacao/autorizacao no backend (`requireAuth` + regras de permissao).

## Itens para evitar duplicacao no futuro (palavras-chave)

- aprovar usuario pendente
- pending approval active login
- /api/users/:id/approve
- acao de aprovacao frontend
