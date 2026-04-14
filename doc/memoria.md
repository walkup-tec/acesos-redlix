# Mem?ria consolidada do projeto

## 2026-04-06 - Supabase exclusivo + identidade visual Credilix

- Backend ajustado para usar Supabase como persist?ncia exclusiva.
- Criado `supabase/schema.sql` com tabelas multi-tenant e RLS habilitado.
- Branding centralizado em `config.branding` com paleta baseada no site Credilix.
- Endpoint `GET /branding` adicionado para frontend consumir tema/logo.
- Setup documentado no `README.md` e vari?veis novas no `.env.example`.

## 2026-04-06 - Frontend moderno integrado ao backend

- Criado frontend React + TypeScript em `web/`.
- Implementadas telas base: login, dashboard e m?dulos de usu?rios/produtos/tabelas/conte?dos.
- Integra??o com API backend para autentica??o, CRUD principal e upload de conte?do.
- Tema aplicado com cores Credilix consumidas via endpoint `GET /branding`.
- Vari?vel `VITE_API_BASE_URL` configurada em `web/.env.example`.

### Palavras-chave para pesquisa futura

- supabase exclusivo
- credilix cores
- endpoint branding
- schema tenant users products commission
- service role backend
- frontend credilix
- painel saas moderno
- vite api base url
- ui servida na porta 5050 (web/dist + Express)
- npm run dev:ui

## 2026-04-06 - UI aero, mobile-first, menu recolh?vel

- Removido o m?dulo Dashboard; entrada padr?o em Usu?rios.
- Layout ?aero?: fundo em gradiente suave, navega??o e header com vidro (`backdrop-filter`), cards claros.
- Mobile (abaixo de 901px de largura): menu em drawer, backdrop, bot?o hamburger; pin de recolher oculto.
- Desktop: sidebar fixa com bot?o para recolher (labels curtas quando colapsado).
- Logo com `object-fit: contain` e limites de largura/altura (login e nav).

### Palavras-chave

- ui aero glass credilix-acessos
- shell-nav drawer mobile
- navCollapsed app-shell--nav-collapsed

## 2026-04-06 - Criar usu?rio por e-mail + permiss?es; pin SVG

- Colunas `perm_*` em `public.users`; migra??o `supabase/migration-2026-04-06-user-permissions.sql`.
- POST `/users/invite` com `{ email, permissions: { permCreateManagers, permCreateSellers, permCommissionTables, permContents } }`; pelo menos uma permiss?o obrigat?ria; criador n?o-MASTER s? concede o que j? tem.
- UI: modal **Criar usu?rio** s? para `role === MASTER` ou `canManageUsers`; menu e formul?rios de tabela/conte?do condicionados ?s permiss?es.
- Respostas de usu?rio via `toPublicTenantUser` (sem segredos).
- Bot?o recolher menu: ?cone SVG em vez de caractere.

### Palavras-chave

- perm_create_managers supabase
- toPublicTenantUser
- normalizeAuthContext JWT antigo

## 2026-04-06 - E-mail e fluxo p?blico convite/ativar

- Envio: convite (link `/convite?token=`), aprova??o (c?digo primeiro acesso + `/ativar`), esqueci senha.
- `MAIL_MODE`: `log` (dev), `smtp` (produ??o), `off`; `MAIL_FROM` + `SMTP_*`; `APP_BASE_URL` nos links.
- `GET /api/auth/invite-context`; JWT de convite 7 dias (`signInviteToken`).
- UI: `onboarding-ui.tsx` (`/convite`, `/ativar`).

### Palavras-chave

- mailer nodemailer credilix-acessos
- convite token invite-context

## 2026-04-06 - Fix painel vazio p?s-login (master)

- `resolvedSession` + decode JWT; master com `role.toUpperCase()`; login usa claims do token.
- `refreshAll` com `Promise.allSettled`; persist?ncia `credilix_session`.

## 2026-04-06 - Card criar usu?rio ? esquerda + presets por tipo

- M?dulo de usu?rios voltou para layout com card ? esquerda (sem modal) e listagem ? direita.
- Topo do card: e-mail + select de tipo (`Vendedor`, `Suporte`, `L?der`).
- Presets autom?ticos por tipo com checkboxes edit?veis:
  - Vendedor: acessar conte?do (sem editar conte?dos)
  - Suporte: autorizar/ativar usu?rios
  - L?der: criar gestores, criar vendedores, editar/criar tabela, editar/criar conte?dos
- Backend: `POST /users/invite` passa a aceitar `role`, `canManageUsers`, `permViewContents`, `permCreateManagers`, `permCreateSellers`, `permCommissionTables`, `permContents`.
- Conte?dos agora exigem permiss?o de visualiza??o (`assertCanViewContents` em `listContents`).
- Banco: nova coluna `perm_view_contents` em `users` (schema + migration).

## 2026-04-06 - Produto e comiss?o no mesmo fluxo

- Removida a aba separada de tabelas no frontend; fluxo consolidado em `Produtos`.
- Formul?rio `Produto + tabela inicial` cria produto e tabela em sequ?ncia no mesmo submit.
- Tela de produtos mostra lista de produtos e lista de tabelas na mesma p?gina.
- Campo de produto com duas fun??es: **Adicionar nome novo** ou **Selecionar nome j? criado**.

## 2026-04-06 - Observa??o opcional + valida??o obrigat?ria com alerta

- Tabela de comiss?o ganhou campo `observation` (opcional) no banco e backend.
- Frontend adicionou input `Observa??o (opcional)` no formul?rio de cria??o de tabela.
- Campos obrigat?rios com alerta expl?cito (`alert`) quando ausentes:
  - Nome do produto
  - Nome da tabela
  - Comiss?o

## 2026-04-07 - Banco obrigat?rio + campos em linha na cria??o de tabela

- Cria??o de tabela ajustada para exibir em linha (desktop): `Produto`, `Banco`, `Tabela`, `Prazo`, `Observa??o`.
- `Banco` adicionado/validado como obrigat?rio em toda a cadeia (UI, API, servi?o e banco).
- `CommissionTable` atualizado com propriedade `bank`.
- Migration criada para `commission_tables.bank` com `NOT NULL`:
  - `supabase/migration-2026-04-07-commission-table-bank-required.sql`
- Listagem de tabelas padronizada na ordem:
  - `Produto | Banco | Tabela | Prazo | Observa??o`

### Palavras-chave

- banco obrigatorio tabela comissao
- layout em linha produto banco tabela prazo observacao
- migration commission_tables bank

## 2026-04-07 - Lista de bancos atualizada via internet no campo Banco

- Campo `Banco` da cria??o de tabela passou a carregar lista atualizada de bancos do Brasil via `https://brasilapi.com.br/api/banks/v1`.
- Implementado `input` com `datalist` para sele??o r?pida + digita??o manual.
- Fallback local com bancos principais para manter opera??o mesmo sem internet/endpoint indispon?vel.
- `Banco` permanece obrigat?rio no formul?rio e no backend.

### Palavras-chave

- brasilapi banks v1 credilix
- datalist bancos brasil campo banco
- fallback lista bancos

## 2026-04-07 - Campo Banco convertido para select pesquis?vel

- Campo `Banco` atualizado de `datalist` para `select` pesquis?vel (busca + sele??o filtrada).
- Busca em tempo real por c?digo/nome, com `filteredBankOptions` no frontend.
- Sele??o continua obrigat?ria para manter qualidade de dados no cadastro da tabela.

### Palavras-chave

- select pesquisavel bancos
- banco busca por codigo nome
- filteredBankOptions credilix

## 2026-04-07 - Modo escuro com troca de logo

- Implementado tema escuro com toggle no header.
- Tema persistido em `localStorage` e aplicado via `body[data-theme]`.
- No modo escuro, a logo passa a usar:
  - `file:///D:/Site%20Credilix/dist/logo-credilix-light.png`
- Ajustadas vari?veis de cor e fundo para experi?ncia dark consistente.

### Palavras-chave

- dark mode credilix acessos
- theme toggle localstorage
- logo-credilix-light modo escuro

## 2026-04-07 - Corre??o de contraste no modo escuro + logo vis?vel

- Corrigida refer?ncia da logo no dark mode para asset servido pela aplica??o (`/branding-assets/logo-credilix-light.png`).
- Adicionado arquivo `public/branding/logo-credilix-light.png`.
- Refeita calibra??o visual do dark mode para melhorar contraste em:
  - fundo, cards e header;
  - menu ativo;
  - inputs/selects;
  - bot?o de altern?ncia de tema.

### Palavras-chave

- ajuste contraste dark mode
- logo dark mode branding assets
- ui moderna credilix acessos

## 2026-04-07 - Bancos via cadastro manual (sem lista externa)

- Removida integra??o com lista de bancos externa no frontend.
- Criado recurso pr?prio de bancos por tenant:
  - `POST /api/banks`
  - `GET /api/banks`
- Fluxo do campo Banco passou a espelhar Produto:
  - selecionar banco existente;
  - ou `+ Adicionar Banco` para cadastro manual.
- Criada tabela `banks` no Supabase (`schema` + migration) com RLS para `service_role`.

### Palavras-chave

- cadastro manual bancos
- banks endpoint credilix
- banco novo ou existente select

## 2026-04-07 - Responsividade com Bootstrap no m?dulo de comiss?o

- Bootstrap adicionado no frontend (`bootstrap/dist/css/bootstrap.min.css`).
- M?dulo `Tabela de Comiss?o` refatorado para grid `row`/`col-*` (mobile-first).
- Formul?rio e listagem ajustados para quebra progressiva por breakpoint, evitando sobreposi??o.

### Palavras-chave

- bootstrap row col mobile first
- tabela comissao responsiva
- layout credilix bootstrap

## 2026-04-08 - Excluir pasta de conte?dos com confirma??o

- Adicionado ?cone de lixeira por pasta no m?dulo `Conte?dos`.
- Ao clicar, sistema pede confirma??o antes de excluir.
- Novo endpoint `DELETE /api/contents/folder` para remover conte?dos de uma pasta e subpastas.
- Exclus?o respeita isolamento por `tenant_id` e permiss?o de edi??o de conte?dos.
- Fluxo frontend atualiza lista de pastas e volta para a raiz quando a pasta ativa ? exclu?da.

### Palavras-chave

- excluir pasta conteudos
- lixeira confirmacao
- delete contents folder tenant

## 2026-04-08 - Confirma??o de exclus?o estilizada (sem alerta nativo)

- Fluxo de exclus?o de pasta no frontend trocado de `window.confirm` para modal visual pr?prio.
- Modal segue identidade do sistema com fundo escuro, borda e bot?o de a??o destrutiva.
- Inclusos controles de fechamento via `X` e `Cancelar`.

### Palavras-chave

- modal de confirmacao customizado
- remover alerta navegador
- excluir pasta ui credilix

## 2026-04-08 - Bot?o Confirmar modal arquivo verde no dark mode

- O tema escuro aplicava `body[data-theme="dark"] button[type="submit"]` (cinza) por cima do verde; adicionado override com maior especificidade em `.content-modal .content-modal__confirm`.

## 2026-04-08 - Fix exclus?o de arquivo (mensagem Supabase + path Windows)

- Erros do Supabase na exclus?o passam a vir como mensagem JSON clara.
- Ordem: apagar linha em `contents` e depois `unlink` no disco; path validado no Windows sem falsos ?Arquivo inv?lido?.
- UI mostra HTTP status se a API devolver HTML (ex.: rota antiga sem rein?cio).

### Palavras-chave

- delete content supabase error message
- uploads path win32

## 2026-04-08 - Stream de arquivo por ID + exclus?o de arquivo na pasta

- Novo `GET /api/contents/:id/file` com `Content-Type` correto (PDF/PNG/JPEG) para uploads sem extens?o no disco.
- Novo `DELETE /api/contents/:id` remove registro e ficheiro em `uploads/`.
- UI: lixeira por arquivo com modal de confirma??o; abertura em nova aba via rota por ID.

### Palavras-chave

- stream conteudo por id mime inline
- excluir arquivo conteudos modal

## 2026-04-08 - Ajuste de grid desktop e painel interno de conte?dos

- Corrigido o m?dulo `Conte?dos` no desktop para n?o herdar colunas indevidas do layout geral.
- Card interno da pasta voltou a ocupar ?rea correta, consistente com Bootstrap.
- Bot?es `Adicionar PDF` e `Adicionar Imagem` ajustados ao estilo visual roxo do tema.
- Exibi??o de nome de arquivo corrigida para remover caminho absoluto em ambiente Windows.

### Palavras-chave

- conteudos desktop grid bootstrap
- card interno pasta largura
- nome arquivo sem caminho completo

## 2026-04-08 - Conte?dos modo claro: painel ao abrir pasta

- Painel interno (`.content-inside-panel`) deixou de usar bloco escuro no tema claro: cart?o claro com texto e bot?es leg?veis.
- T?tulo **Conte?dos** no claro usa `var(--brand-fg)` em vez de branco fixo.
- Lista de ficheiros: links e ?cones com roxo escuro; eliminar com vermelho leg?vel sobre fundo claro.

### Palavras-chave

- content-inside-panel light theme
- conteudos contraste modo claro

## 2026-04-08 - Tabela de Comiss?o: card sem ?Cria??o de Tabela? + layout compacto

- Removido o t?tulo interno do card; mant?m-se o t?tulo da p?gina **Tabela de Comiss?o**.
- Classe `commission-table-create-form`: menos espa?o entre campos e no topo do card; bot?o **Incluir** com padding e tipografia mais baixos.
- Linha de campos: `gx-2 gy-1` em vez de `g-2`.

### Palavras-chave

- commission-table-create-form
- tabela comiss?o formul?rio compacto

## 2026-04-10 - Aprovar usuario pendente para liberar login

- Confirmado fluxo de seguranca: usuario recem-cadastrado fica `PENDING_APPROVAL` e nao pode logar ate aprovacao.
- Backend ja possuia `POST /api/users/:id/approve` para transicao de status para `ACTIVE`.
- Frontend atualizado com acao explicita de **Aprovar e ativar** na tabela de usuarios quando status estiver pendente.
- Novo modal de confirmacao de aprovacao e feedback de sucesso no painel.
- Estilo do botao de aprovacao adicionado para tema claro/escuro.
- Regra visual de status ajustada: `ACTIVE` agora exibe "Ativo" mesmo sem `firstAccessVerifiedAt`.

### Palavras-chave

- aprovar usuario pendente
- pending approval
- users approve endpoint
- liberar login apos cadastro

## 2026-04-10 - Perfil VENDEDOR em leitura (menu restrito)

- Menu lateral passou a ocultar `Usuarios` para perfil sem permissao de gestao.
- `VENDEDOR` permanece com acesso a `Tabela de Comissao` e `Conteudos`.
- Mantido comportamento de somente leitura quando nao ha permissoes de edicao.
- Se o modulo atual nao for permitido, app redireciona para o primeiro modulo autorizado.

### Palavras-chave

- vendedor somente leitura
- menu por permissao
- ocultar modulo usuarios
- fallback modulo permitido

## 2026-04-10 - Vendedor sem card de criacao na comissao

- Formulario/card de criacao de tabela foi removido para perfil sem permissao de edicao.
- Em modo leitura, permanece apenas listagem e filtros de `Tabela de Comissao`.
- Layout da listagem usa largura total quando o card de criacao nao existe.

### Palavras-chave

- remover card incluir vendedor
- tabela comissao readonly
- canEditCommissionTables false

## 2026-04-10 - Conteudos exibem nome informado no upload

- Campo `display_name` adicionado ao fluxo de conteudos.
- Upload (`POST /api/contents`) passa a receber/salvar nome amigavel.
- Listagem (`GET /api/contents`) retorna `displayName`.
- Frontend prioriza `displayName` para renderizar nome do arquivo na tela de Conteudos.
- Migration criada para `public.contents.display_name`.

### Palavras-chave

- display_name contents
- nome amigavel arquivo
- upload conteudos nome exibicao

## 2026-04-10 - Conteudos (Master): botao adicionar pasta junto aos uploads

- No painel interno de pasta, adicionado `Adicionar Pasta` ao lado de `Adicionar PDF` e `Adicionar Imagem`.
- Ajuste aplicado tanto para pasta com arquivos quanto para estado vazio.
- Fluxo de criacao de subpasta permanece no mesmo modal existente (`openFolderModal`).

### Palavras-chave

- adicionar pasta ao lado adicionar pdf
- subpastas conteudos master
- content-inside-panel actions

## 2026-04-10 - Subpasta visivel dentro da pasta atual

- Corrigida visibilidade de subpastas no contexto interno de Conteudos.
- Classe de ocultacao da grade de pastas foi removida quando ha `currentFolderPath`.
- Agora, ao criar pasta dentro de pasta, ela aparece imediatamente na listagem do nivel atual.

### Palavras-chave

- subpasta visivel
- content-folders sem hidden
- pasta dentro de pasta conteudos

## 2026-04-10 - Subpastas no mesmo card da pasta atual

- Em pasta aberta, subpastas agora renderizam dentro do mesmo card (`content-inside-panel`), abaixo da lista de arquivos.
- A grade de pastas da raiz permanece apenas no contexto raiz.

### Palavras-chave

- subpasta abaixo dos arquivos
- mesmo card conteudos
- pasta aberta currentFolderPath

## 2026-04-10 - Botao voltar por nivel em Conteudos

- Adicionado botao discreto `Voltar` no painel interno de pastas.
- Funciona por nivel: sobe um diretorio por clique.
- Disponivel tanto em pasta com arquivos quanto em pasta vazia.

### Palavras-chave

- voltar pasta anterior
- hierarquia subpastas
- currentFolderPath parent

## 2026-04-10 - Acoes de edicao/exclusao em tabelas de comissao

- Adicionadas acoes por linha da tabela: editar e excluir.
- Adicionadas acoes no card pai (produto): editar nome do produto e excluir todas as tabelas daquele produto.
- Backend recebeu rotas `PATCH/DELETE` para `commission-tables` e `PATCH` para `products`.
- Permissao de alteracao mantida em `assertCanEditCommissionTables`.

### Palavras-chave

- commission table edit delete
- delete by product
- product card actions

## 2026-04-10 - Confirmacao de exclusao de tabelas via modal interno

- Fluxos de exclusao de tabelas sairam de `window.confirm` para modal interno.
- Mesmo estilo visual do modal de exclusao de conteudos (`content-modal--confirm-delete`).
- Aplicado para:
  - tabela individual;
  - exclusao de todas as tabelas do produto.

### Palavras-chave

- modal exclusao tabela
- sem alerta nativo navegador
- confirmacao interna produto

## 2026-04-10 - Atualize tudo: backup, build, gitignore, commit

- Executada rotina **atualize tudo**: backup `C:\Scripts\backup-d-para-e.ps1` (espelho para `E:\`), `npm run build` + `npm run build:web` em `D:\Credilix-acessos`.
- Criado `.gitignore` na raiz do repo para excluir `.env`, `node_modules/`, `dist/`, `web/dist/`, `uploads/`, `data/`.
- Log de handoff: `doc/LOG-2026-04-10__200500__chore-atualize-tudo-retomar-trabalhos.md`.

### Palavras-chave para pesquisa futura

- atualize tudo credilix-acessos
- backup D para E robocopy
- gitignore dist uploads data
- retomar trabalhos main acesos-redlix

## 2026-04-13 - Fix login Failed to fetch (API offline)

- Erro de login identificado como indisponibilidade do backend local (`127.0.0.1:5050`).
- API iniciada com `npm run dev` em `D:\Credilix-acessos`.
- Healthcheck e login do master validados com sucesso apÃ³s subir o serviÃ§o.
- Log detalhado: `doc/LOG-2026-04-13__101500__fix-login-failed-to-fetch-api-offline.md`.

### Palavras-chave para pesquisa futura

- failed to fetch login credilix
- api 5050 offline
- npm run dev backend credilix

## 2026-04-13 - Padronizacao: sem alertas nativos

- Removidos `window.alert` e `window.prompt` restantes em `web/src/App.tsx`.
- EdiÃ§Ã£o de tabela de comissÃ£o e ediÃ§Ã£o de produto migradas para modais internos do sistema.
- Build do frontend executado apÃ³s ajuste: `npm run build:web`.
- Log detalhado: `doc/LOG-2026-04-13__103500__fix-remover-alertas-nativos-e-usar-modais-sistema.md`.

### Palavras-chave para pesquisa futura

- sem alertas nativos navegador
- modal interno editar tabela
- modal interno editar produto

## 2026-04-13 - Fix salvar ediÃ§Ã£o de comissÃ£o

- Erro ao salvar ediÃ§Ã£o de comissÃ£o identificado como incompatibilidade de schema (`PGRST204`): coluna `observation` ausente em `commission_tables` no ambiente atual.
- Backend ajustado para atualizar tabela sem depender desse campo (`src/services.ts`).
- Frontend ajustado para nÃ£o enviar `observation` no PATCH da ediÃ§Ã£o de comissÃ£o (`web/src/App.tsx`).
- Log detalhado: `doc/LOG-2026-04-13__104800__fix-editar-comissao-coluna-observation-ausente.md`.

### Palavras-chave para pesquisa futura

- erro editar tabela comissao 400
- pgrst204 observation ausente
- patch commission table fix

## 2026-04-13 - Fix criar tabela com fallback de banco

- Fluxo de criaÃ§Ã£o de tabela estava falhando quando `POST /api/banks` retornava erro no ambiente atual.
- Frontend ajustado para fallback automÃ¡tico: usa banco digitado e mantÃ©m criaÃ§Ã£o da tabela sem bloquear a operaÃ§Ã£o.
- Build do frontend executado apÃ³s ajuste.
- Log detalhado: `doc/LOG-2026-04-13__110200__fix-criar-tabela-fallback-banco.md`.

### Palavras-chave para pesquisa futura

- erro criar banco 400
- fallback bancos api indisponivel
- criar tabela comissao sem travar

## 2026-04-13 - Pastas de conteÃºdos compartilhadas

- Corrigido problema de pasta criada no MASTER nÃ£o aparecer para VENDEDOR.
- Implementado `POST /api/contents/folder` com persistÃªncia de marcador `type: "FOLDER"` no backend.
- Frontend passou a criar pasta no backend e filtrar marcadores da lista de arquivos/contagens.
- Log detalhado: `doc/LOG-2026-04-13__111800__fix-pastas-compartilhadas-entre-usuarios.md`.

### Palavras-chave para pesquisa futura

- pasta compartilhada entre usuarios
- folder marker contents
- post api contents folder

## 2026-04-13 - ExclusÃ£o de usuÃ¡rio para reenvio de convite

- UsuÃ¡rio `somaconecta@gmail.com` removido de `public.users` para permitir recriaÃ§Ã£o via convite.
- VerificaÃ§Ã£o concluÃ­da: antes 1 registro, depois 0 registros.
- Log detalhado: `doc/LOG-2026-04-13__113800__delete-user-email-somaconecta.md`.

### Palavras-chave para pesquisa futura

- excluir usuario por email
- limpar cadastro convite
- somaconecta gmail delete

## 2026-04-13 - Novo status de ciclo de convite

- Implementado status `AWAITING_REVIEW` para indicar formulÃ¡rio concluÃ­do aguardando ativaÃ§Ã£o por master/gestÃ£o.
- Backend atualizado para setar esse status no `completeRegistration`.
- Frontend atualizado para exibir rÃ³tulo `Aguardando AvaliaÃ§Ã£o` com semÃ¡foro azul.
- Compatibilidade mantida: aprovaÃ§Ã£o aceita `PENDING_APPROVAL` e `AWAITING_REVIEW`.
- Log detalhado: `doc/LOG-2026-04-13__121500__feat-status-aguardando-avaliacao-usuarios.md`.

### Palavras-chave para pesquisa futura

- status aguardando avaliacao
- semaforo azul usuario
- awaiting review complete registration

## 2026-04-13 - Modal de detalhes ao clicar no usuÃ¡rio

- Tabela de usuÃ¡rios agora abre modal de detalhes em modo leitura ao clicar na linha.
- Modal mostra dados completos de cadastro e acessos para documentos anexados no onboarding.
- Coluna de aÃ§Ãµes segue funcional sem abrir modal acidental (stopPropagation nos botÃµes).
- Log detalhado: `doc/LOG-2026-04-13__123500__feat-modal-detalhes-usuario-ao-clicar-linha.md`.

### Palavras-chave para pesquisa futura

- modal detalhes cadastro usuario
- clique linha usuarios abre modal
- ver documentos onboarding usuario

## 2026-04-13 - ObservaÃ§Ã£o de tabela (coluna ausente)

- Causa de nÃ£o exibir Ã­cone de observaÃ§Ã£o: banco sem coluna `commission_tables.observation` (`42703`).
- Migration criada para correÃ§Ã£o: `supabase/migration-2026-04-13-add-commission-observation.sql`.
- ApÃ³s aplicar migration no Supabase, observaÃ§Ãµes passam a persistir e o Ã­cone `Obs.` aparece no frontend.

### Palavras-chave para pesquisa futura

- commission_tables observation 42703
- migration coluna observation
- obs tooltip tabela comissao

## 2026-04-13 - UI: flag de observaÃ§Ã£o (amarelo de marca)

- Coluna **Obs.**: Ã­cone `Info` maior (22px), cor `var(--brand-secondary)`; popover â€œflagâ€ acima do Ã­cone com fundo/borda derivados da mesma cor (claro/escuro).
- Abre com **hover** ou **clique** (clique fixa atÃ© clicar fora, outro Ã­cone ou `Escape`).
- Log: `doc/LOG-2026-04-13__150000__update-ui-observacao-flag-brand-secondary.md`.

### Palavras-chave para pesquisa futura

- table-observation-flag brand-secondary
- observacao comissao popover hover pin

## 2026-04-13 - Deploy FTP (paridade Waba) + domÃ­nio acessos

- Mesmo modelo do Waba: `npm run bundle:ftp` â†’ `ftp-bundle/`, GitHub Actions com `SamKirkland/FTP-Deploy-Action`, secrets `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_REMOTE_DIR`.
- DomÃ­nio documentado: **https://acessos.credilixpromotora.com.br/** â€” apÃ³s FTP Ã© obrigatÃ³rio **Node** + `.env` (`APP_BASE_URL` HTTPS); FTP sozinho nÃ£o executa a API.
- Log: `doc/LOG-2026-04-13__171000__feat-deploy-ftp-paridade-waba-acessos-dominio.md`, guia `doc/deploy-ftp-github.md`.

### Palavras-chave para pesquisa futura

- credilix deploy ftp github actions
- bundle ftp acessos credilixpromotora

## 2026-04-13 - Easypanel: Nixpacks Node 20 (Vite 8)

- Build falhava em Node 18; adicionado `nixpacks.toml` com `nodejs_20` + `npm-10_x` e `engines.node` no `package.json`.
- Log: `doc/LOG-2026-04-13__210000__fix-nixpacks-node20-easypanel-vite.md`.

### Palavras-chave para pesquisa futura

- nixpacks easypanel node 20 vite


## 2026-04-14 - Usuários: ativar após bloqueio + flag de motivo

- Ação de usuário agora alterna entre bloquear e **ativar** conforme status (`ACTIVE`/`INACTIVE`/`BLOCKED`).
- API de status passou a aceitar reativação (`ACTIVE`) mantendo motivo obrigatório para bloquear/inativar.
- Tabela de usuários passou a exibir flag com `statusReason` (hover/click), no mesmo padrão visual da observação das comissões.
- Log: `doc/LOG-2026-04-14__071454__update-usuarios-ativar-bloqueio-flag-motivo.md`.

### Palavras-chave para pesquisa futura

- ativar usuario bloqueado
- status reason flag usuarios

## 2026-04-14 - Limpeza da flag de motivo ao reativar

- Ajustado ciclo de status para limpar `status_reason` quando usuário volta para `ACTIVE`.
- Com isso, a flag de motivo desaparece após reativação, mantendo apenas motivos vigentes de bloqueio/inativação.
- Log: `doc/LOG-2026-04-14__072108__fix-limpar-flag-motivo-ao-reativar.md`.

### Palavras-chave para pesquisa futura

- status_reason limpar active
- reativar usuario remover flag

## 2026-04-14 - UI: contraste de texto em modais

- Ajustado contraste de título e textos auxiliares (`.muted`) dentro de `modal-dialog` para melhorar leitura no modo claro.
- Mantida paridade no modo escuro com regra específica para `body[data-theme="dark"] .modal-dialog .muted`.
- Log: `doc/LOG-2026-04-14__072943__fix-contraste-texto-modal.md`.

### Palavras-chave para pesquisa futura

- modal contraste texto
- muted modal claro

## 2026-04-14 - Modal: fonte cinza escuro no modo claro

- Ajustadas cores de texto do modal apenas para ody[data-theme="light"] com cinza escuro de maior contraste.
- Modo escuro mantido sem mudanças.

### Palavras-chave para pesquisa futura

- modal modo claro cinza escuro
- contraste texto modal light

## 2026-04-14 - Modal excluir tabela com contraste correto no claro

- Corrigido content-modal__description no modo claro para cinza escuro, mantendo escuro sem alterações.
- Log: $log.

### Palavras-chave para pesquisa futura

- content-modal description light contrast
- excluir tabela modal legibilidade


## 2026-04-14 - Limpeza de dados para reteste

- Limpos registros de commission_tables do tenant Credilix.
- Limpos usuários do tenant, preservando apenas master@credilix.local.
- Log: $log.

### Palavras-chave para pesquisa futura

- limpar users tenant
- zerar commission tables

## 2026-04-14 - E-mail de ativação com dados de acesso

- Ajustado e-mail enviado na aprovação do usuário para mensagem de ativação com URL de acesso, e-mail e referência à senha cadastrada.
- Log: $log.

### Palavras-chave para pesquisa futura

- aprovacao usuario email ativado
- credilix acesso ativado

## 2026-04-14 - Recuperação de senha em fluxo sequencial

- Refatorado /ativar para recuperação de senha em 3 etapas: e-mail ? código ? nova senha.
- Ao concluir, redireciona automaticamente para tela de login.
- Log: $log.

### Palavras-chave para pesquisa futura

- forgot password wizard 3 etapas
- redirecionar para login apos reset

## 2026-04-14 - Recuperação de senha com etapas exclusivas

- Fluxo de recuperação agora aparece como wizard exclusivo (uma etapa por vez), ocultando bloco de primeiro acesso durante o processo.
- Log: $log.

### Palavras-chave para pesquisa futura

- etapa exclusiva recuperar senha
- ativar flow esconder primeiro acesso

## 2026-04-14 - Recuperação de senha com etapas estritas

- Fluxo `/ativar` ajustado para 3 etapas obrigatórias: solicitar código por e-mail, validar código, gravar nova senha com confirmação.
- Novo endpoint de validação: `POST /api/auth/validate-reset-code`.
- Após gravar senha com sucesso, redireciona automaticamente para login (`/`).
- Log: `doc/LOG-2026-04-14__085428__refactor-recuperacao-senha-etapas-estritas.md`.

### Palavras-chave para pesquisa futura

- recuperar senha etapas estritas
- validate-reset-code

## 2026-04-14 - Envio real obrigatório no esqueci a senha

- `forgotPassword` agora exige `MAIL_MODE=smtp` e valida retorno de envio.
- Quando SMTP falha, API retorna erro explícito para o frontend (sem falso sucesso).
- Log: `doc/LOG-2026-04-14__090258__fix-recuperacao-senha-envio-real-smtp.md`.

### Palavras-chave

- forgot-password smtp obrigatorio
- erro explicito envio codigo

## 2026-04-14 - Correção login: olho da senha + favicon

- Login recebeu botão de mostrar/ocultar senha (ícone olho).
- Link de recuperação no login ficou como `Esqueci minha senha`.
- Favicon do `D:\Site Credilix` aplicado no frontend via `web/public/favicon.png`.
- `web/index.html` atualizado para usar `favicon.png`.
- Log: `doc/LOG-2026-04-14__133008__fix-login-olho-senha-e-favicon.md`.

### Palavras-chave

- olho senha
- esqueci minha senha
- favicon.png

## 2026-04-14 - Reset de usuário com validação real de SMTP

- `resetUserAccessByManager` agora valida `MAIL_MODE=smtp` e retorno de envio.
- Em falha SMTP, API retorna erro explícito no reset de acesso.
- Log: `doc/LOG-2026-04-14__141442__fix-reset-usuario-validacao-smtp.md`.

### Palavras-chave

- reset user smtp
- erro envio reset

## 2026-04-14 - Limpeza de produtos/tabelas/conteúdos

- Banco zerado para `products`, `commission_tables` e `contents`.
- Contagens após limpeza: `products=0`, `commission_tables=0`, `contents=0`.
- Tabela `users` mantida sem alterações.
- Log: `doc/LOG-2026-04-14__162115__cleanup-banco-produtos-tabelas-conteudos.md`.

### Palavras-chave

- cleanup banco
- zerar listas
- products commission_tables contents

## 2026-04-14 - Botão Atualizar na lista de usuários

- Adicionado botão `Atualizar` no módulo de usuários sem recarregar a página.
- Atualização chama `GET /api/users` e recarrega apenas a tabela de usuários.
- Inclui loading e aviso de sucesso no painel.
- Log: `doc/LOG-2026-04-14__162958__feat-botao-atualizar-usuarios.md`.

### Palavras-chave

- atualizar usuarios
- refresh users
- card-toolbar

## 2026-04-14 - Ajuste visual do botão Atualizar em usuários

- Botão `Atualizar` ficou menor e com background no padrão dos botões de ação.
- Hover e modo escuro alinhados ao visual existente no sistema.
- Log: `doc/LOG-2026-04-14__163857__style-botao-atualizar-usuarios-menor-padrao.md`.

### Palavras-chave

- style botao atualizar
- users toolbar
- padrao botoes

## 2026-04-14 - Filtro e pesquisa na lista de usuários

- Adicionado filtro por status ao lado do botão `Atualizar` no módulo de usuários.
- Adicionado campo de pesquisa alinhado à direita abaixo do título `Usuários`.
- Busca cobre `ID`, `CPF`, `nome` e `e-mail`.
- Log: `doc/LOG-2026-04-14__165228__feat-filtro-status-e-pesquisa-usuarios.md`.

### Palavras-chave

- filtro usuarios
- pesquisa usuarios
- status users

## 2026-04-14 - Ajuste de alinhamento no toolbar de usuários

- Removido texto `Status` no filtro.
- Campo de pesquisa realinhado para esquerda abaixo do título `Usuários`.
- Filtro e botão `Atualizar` mantidos lado a lado à direita.
- Log: `doc/LOG-2026-04-14__165947__fix-alinhamento-toolbar-usuarios.md`.

### Palavras-chave

- alinhamento usuarios toolbar
- filtro status sem label
- pesquisa esquerda

## 2026-04-14 - Correção final de alinhamento no toolbar de usuários

- Toolbar de usuários expandida para largura total do card.
- Filtro + Atualizar fixados à direita com `margin-left: auto`.
- Busca mantida abaixo do título à esquerda.
- Log: `doc/LOG-2026-04-14__171450__fix-toolbar-usuarios-largura-completa.md`.

### Palavras-chave

- toolbar usuarios largura 100
- filtro atualizar direita
- pesquisa esquerda

## 2026-04-14 - Layout toolbar usuários (stack correto)

- Removido conflito card-toolbar + users-toolbar que empurrava linhas para flex row.
- Toolbar em coluna: linha 1 título | filtro+atualizar; linha 2 pesquisa à esquerda.
- Log: doc/LOG-2026-04-14__174500__fix-users-toolbar-stack-layout.md



## 2026-04-14 - Busca de usuários: CPF com ou sem máscara

- Pesquisa normaliza dígitos do termo e do CPF cadastrado; aceita entrada só numérica ou com `.` e `-`.
- Log: `doc/LOG-2026-04-14__180000__fix-busca-usuarios-cpf-formatado.md`.

### Palavras-chave

- busca cpf normalizada

## 2026-04-14 - Menu lateral: tema no rodapé, sem Atualizar global

- Removido botão `Atualizar` do menu lateral; mantido apenas nas telas que precisam (ex.: usuários).
- Tema claro/escuro movido para o grupo do rodapé, acima de `Sair`.
- Log: `doc/LOG-2026-04-14__181200__refactor-menu-lateral-sem-atualizar-tema-no-rodape.md`.

### Palavras-chave

- shell-nav rail footer- tema proximo sair

## 2026-04-14 - Ícone discreto do usuário logado no menu lateral

- Adicionado ícone discreto no rodapé do menu lateral.
- Ao clicar, abre popover com nome completo, e-mail e CPF do usuário logado.
- Fechamento por clique fora e tecla `Escape`.
- Log: `doc/LOG-2026-04-14__182014__feat-icone-usuario-logado-no-menu-lateral.md`.

### Palavras-chave

- icone usuario logado menu lateral
- popover nome email cpf

## 2026-04-14 - Senha do master sincronizada com .env no startup

- `ensureBootstrapMaster` passa a atualizar `password_hash` do master existente a partir de `BOOTSTRAP_MASTER_PASSWORD` a cada subida da API.
- `reset_code` do master é limpo na sincronização.
- Log: `doc/LOG-2026-04-14__183500__feat-sync-bootstrap-master-password-no-startup.md`.

### Palavras-chave

- bootstrap master sync password
- BOOTSTRAP_MASTER_PASSWORD

## 2026-04-14 - Mobile: viewport sem scroll horizontal na navegação

- Em telas ≤900px, html/ody/#root/.app-shell/.shell-main com overflow-x: hidden e largura limitada a 100%, mais overscroll-behavior-x: none no body, para a página não "deslizar" ao arrastar nos lados.
- .shell-body com min-width: 0 e max-width: 100%; .table-wrap com max-width: 100% mantendo scroll horizontal **só** nas tabelas.
- Overlays/modais: calc(100% - …) em vez de 100vw onde aplicável; drawer 88% em vez de 88vw.
- Log: doc/LOG-2026-04-14__191800__fix-mobile-viewport-sem-scroll-horizontal.md.

### Palavras-chave para pesquisa futura

- mobile overflow-x viewport credilix-acessos
- table-wrap horizontal scroll only

## 2026-04-14 - Mobile: Bootstrap row dentro de shell-body (comissão)

- Corrigido deslocamento da **Tabela de Comissão** no iPhone: .row do Bootstrap tinha margens negativas sem .container, estourando a largura de .shell-body.
- Em ≤900px: .shell-body .row com margens horizontais zeradas; colunas com max-width: 100% e min-width: 0; .products-filters em uma coluna.
- Log: doc/LOG-2026-04-14__195500__fix-mobile-bootstrap-row-comissao-viewport.md.

### Palavras-chave para pesquisa futura

- bootstrap row shell-body credilix
- comissão mobile layout overflow

## 2026-04-14 - Mobile Usuários: sem scroll horizontal (fieldset + flex)

- Corrigido overflow lateral na tela **Usuários**: `fieldset`/`.perm-fieldset` com min-width: 0 e max-width: 100%; .checkbox-row e texto com min-width: 0 e overflow-wrap: break-word; .module-grid/.card e input/select reforçados; .shell-body com overflow-x: hidden ≤900px; toolbar de usuários com wrap e select flexível.
- Log: doc/LOG-2026-04-14__201000__fix-mobile-usuarios-scroll-horizontal-fieldset-flex.md.

### Palavras-chave para pesquisa futura

- perm-fieldset min-width mobile
- checkbox-row flex shrink usuarios

## 2026-04-14 - Usuários: select e botão Atualizar mesma altura

- Toolbar: regra única para filtro e .btn-secondary.card-toolbar__action-btn com mesmo min-height e padding.
- Log: doc/LOG-2026-04-14__203000__style-usuarios-toolbar-select-altura-botao.md.

## 2026-04-14 - Usuários: toolbar mobile em coluna (ordem pedida)

- ≤900px: título, depois Atualizar, depois select de status, depois pesquisa; lex + order no bloco de ações.
- Log: doc/LOG-2026-04-14__204500__style-usuarios-toolbar-mobile-ordem-vertical.md.

## 2026-04-14 - Usuários: toolbar mobile refinada (largura select + altura WebKit)

- Mobile: select com largura automática (não 100%); altura 2.5rem igual ao botão; select com appearance none + chevron SVG; pesquisa com min-height alinhada.
- Log: doc/LOG-2026-04-14__210500__fix-usuarios-toolbar-mobile-alinhamento-altura-select.md.

## 2026-04-14 - Fix cascata CSS: toolbar Usuários mobile-first

- Bug: .users-toolbar__top { row } global vinha depois do @media (max-width: 900px) e anulava o layout em coluna. Base agora é coluna; desktop em @media (min-width: 901px).
- Log: doc/LOG-2026-04-14__213000__fix-cascade-css-toolbar-usuarios-mobile-first.md.
