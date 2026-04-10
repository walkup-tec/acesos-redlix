# LOG: Convite em 3 etapas, ViaCEP, 3 uploads, e-mail HTML e documentos para gestores

## Contexto

Validacao de acesso do convidado: e-mail com botao **Validar Usuario**, fluxo em `/convite` com etapas (dados pessoais incl. pai/mae, localizacao com CEP + [ViaCEP](https://viacep.com.br/), documentos frente/verso + comprovante), mensagem final pedida, persistencia no cadastro e visualizacao de anexos por Master/quem pode gerenciar usuarios.

## Acoes executadas

1. **Supabase**: `migration-2026-04-09-invite-registration-profile.sql` + `schema.sql` com colunas `father_name`, `mother_name`, endereco estruturado (`zip_code`, `street`, `neighborhood`, `city`, `state`, `address_number`, `address_complement`), `identity_document_back_path`.
2. **Backend**: `completeRegistration` grava todos os campos, monta `address` legivel; `POST .../complete-registration` com Multer para `identityDocumentBack`; validacao Zod; `completeRegistration` recarrega linha apos update.
3. **E-mail**: `buildInviteEmailHtml` em `mailer.ts` (botao + link texto); `inviteUser` envia `html` + `text`.
4. **Privacidade**: `toPublicTenantUserForViewer` — `GET /api/users` omite `documents` exceto para `MASTER` ou `canManageUsers`.
5. **Frontend convite**: `onboarding-ui.tsx` wizard 3 etapas, mascaras CEP/CPF/data, fetch ViaCEP (blur com 8 digitos + botao Buscar).
6. **Painel**: modal Editar usuario com campos extras e botoes para abrir arquivos via `GET /api/files/:fileName` com Bearer; `PUT /users/:id` aceita os novos campos opcionais; CPF no PUT normalizado com Zod.
7. **`.env.example`**: nota SMTP porta 465 + SSL.

## Arquivos alterados

- `supabase/migration-2026-04-09-invite-registration-profile.sql`, `supabase/schema.sql`
- `src/types.ts`, `src/mailer.ts`, `src/services.ts`, `src/routes.ts`
- `web/src/onboarding-ui.tsx`, `web/src/App.tsx`, `web/src/index.css`
- `.env.example`

## Como validar

1. Aplicar migracao no projeto Supabase.
2. `MAIL_MODE=smtp`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (senha **nao** commitar).
3. Criar convite; conferir e-mail com botao; completar fluxo em `/convite?token=...`.
4. Como Master (ou com autorizacao de usuarios): listar usuarios, editar pendente, abrir os tres documentos.

## Seguranca

- Senha de e-mail apenas em `.env` local / secrets do host.
- Caminhos de upload continuam com nomes opacos; listagem de `documents` restrita a perfis autorizados.

## Palavras-chave

- convite tres etapas viacep
- identity_document_back_path
- buildInviteEmailHtml Validar Usuario
- toPublicTenantUserForViewer documents
