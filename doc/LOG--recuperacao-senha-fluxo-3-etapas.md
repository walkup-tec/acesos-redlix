# LOG: refactor recuperação de senha em 3 etapas

## Contexto

Solicitado melhorar recuperação de senha no /ativar com fluxo sequencial:
1) informar e-mail;
2) informar código recebido;
3) criar nova senha;
com redirecionamento automático para login ao concluir.

## Solução implementada

- web/src/onboarding-ui.tsx (AtivarFlow):
  - removido layout antigo com blocos paralelos de "esqueci" e "nova senha";
  - criado wizard de recuperação com estado orgotStep (1 | 2 | 3);
  - etapa 1: envia código para e-mail (/auth/forgot-password);
  - etapa 2: valida entrada de código (6 dígitos) e avança;
  - etapa 3: define nova senha (/auth/reset-password);
  - após sucesso, redireciona automaticamente para / (login).

## Arquivo alterado

- web/src/onboarding-ui.tsx

## Validação

- 
pm run build --prefix web concluído com sucesso.

## Segurança

- Fluxo mantém necessidade de código por e-mail + nova senha; sem exposição de credenciais.

## Palavras-chave

- recuperar senha 3 etapas
- ativar flow forgot password wizard
