# LOG — status "Aguardando Ativação" para usuários

## Contexto

Solicitado novo status para o ciclo de criação de usuário: **Aguardando Ativação** (semaforo azul), indicando que o convidado já concluiu o formulário e agora depende de ativação por master/gestão.

## Implementação

1. Backend:
   - Adicionado status `AWAITING_REVIEW` em `src/types.ts`.
   - Fluxo de `completeRegistration` (`src/services.ts`) passa a gravar `status: "AWAITING_REVIEW"` ao concluir envio do formulário.
   - `approveUser` agora aceita aprovar tanto `PENDING_APPROVAL` quanto `AWAITING_REVIEW` (compatibilidade com registros antigos).

2. Frontend:
   - `formatUserLifecycleStatus` em `web/src/App.tsx` agora exibe:
     - `Aguardando Ativação` para `AWAITING_REVIEW` e `PENDING_APPROVAL`.
   - Semáforo azul com classe `status--review` em `web/src/index.css`.
   - Botão de aprovar continua disponível para ambos status (`PENDING_APPROVAL` e `AWAITING_REVIEW`).

## Arquivos alterados

- `src/types.ts`
- `src/services.ts`
- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `npm run build` (backend) OK.
- `npm run build:web` (frontend) OK.
- Sem erros de lint nos arquivos alterados.

## Palavras-chave

- aguardando avaliacao usuario
- status azul semaforo
- awaiting review invite flow
