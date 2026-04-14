# LOG: recuperação de senha em etapas exclusivas (uma por vez)

## Contexto

Apesar da refatoração anterior, foi solicitado reforçar UX para que apenas a etapa atual da recuperação apareça após cumprir a anterior.

## Solução implementada

- web/src/onboarding-ui.tsx (AtivarFlow):
  - Adicionado estado isRecoveringPassword.
  - Tela inicial mostra bloco de validação de primeiro acesso + botão "Esqueci a senha".
  - Ao iniciar recuperação, bloco de primeiro acesso é ocultado.
  - Wizard passa a exibir uma única etapa por vez (1/3, 2/3, 3/3), sem blocos paralelos.
  - Botões de voltar entre etapas e retorno para tela inicial de ativação.

## Arquivo alterado

- web/src/onboarding-ui.tsx

## Validação

- 
pm run build --prefix web concluído com sucesso.

## Palavras-chave

- forgot password etapa exclusiva
- recuperar senha um passo por vez
