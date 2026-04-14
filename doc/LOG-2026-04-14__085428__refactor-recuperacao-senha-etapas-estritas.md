# LOG: recuperação de senha com etapas estritas (email -> código -> nova senha)

## Contexto

Solicitado fluxo com etapas obrigatórias e progressivas:
1) informar e-mail e solicitar código;
2) informar código e validar;
3) informar nova senha + confirmar senha e gravar;
4) redirecionar para login.

## Solução implementada

### Backend
- `src/services.ts`
  - nova função `validateResetCode(email, resetCode)` para validar código antes de abrir etapa de senha.
- `src/routes.ts`
  - novo endpoint `POST /api/auth/validate-reset-code`.

### Frontend
- `web/src/onboarding-ui.tsx` (`AtivarFlow`)
  - fluxo simplificado para recuperação de senha em 3 etapas estritas;
  - etapa 1: campo e-mail + botão `Solicitar código`;
  - etapa 2: campo código + botão `Validar` (chama `/auth/validate-reset-code`);
  - etapa 3: campos `Informe a nova senha` e `Confirmar nova senha` + botão `Gravar senha`;
  - após sucesso no reset, redireciona para `/` (login).

## Arquivos alterados

- `src/services.ts`
- `src/routes.ts`
- `web/src/onboarding-ui.tsx`

## Validação

- `npm run build` (backend) OK
- `npm run build --prefix web` (frontend) OK

## Palavras-chave

- recuperar senha etapas estritas
- validate reset code endpoint
- gravar senha confirmar senha
