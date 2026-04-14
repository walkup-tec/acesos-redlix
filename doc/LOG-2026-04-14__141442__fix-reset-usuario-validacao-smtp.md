# LOG: correção de validação SMTP no reset de acesso

## Contexto

Ao executar reset de usuário, o sistema não enviava e-mail e não retornava erro explícito ao gestor.

## Causa raiz

Na função `resetUserAccessByManager`, o envio era feito com `trySendMail` sem validar `mailResult.ok`.

## Solução aplicada

- Arquivo: `src/services.ts`
- Ajustes:
  - valida `MAIL_MODE=smtp` antes do envio;
  - valida retorno de `trySendMail`;
  - retorna erro explícito em falha SMTP: `Não foi possível enviar o e-mail de reset: ...`.

## Validação

- `npm run build` (backend) OK

## Segurança

- Sem exposição de segredos.

## Palavras-chave

- reset user smtp
- trySendMail mailResult
- erro explicito reset acesso
