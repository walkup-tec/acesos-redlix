## Contexto do pedido

Alerta de `Login Banco` permanecia mesmo após visualizar login já respondido.

## Causa raiz

No frontend, a marcação de visualização estava condicionada apenas a `requesterUserId`.  
Quando o login foi criado para um usuário-alvo (`targetUserId`), a rotina não executava.

## Solução aplicada

- Ajustada função `openViewBankLoginModal` em `web/src/App.tsx`.
- Critério de elegibilidade para marcar como visualizado agora considera:
  - `requesterUserId === session.id` **ou**
  - `targetUserId === session.id`
- Mantido comportamento de atualizar dados após marcação.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `npm run build:web` OK

## Palavras-chave

- alerta login banco nao limpa
- target_user_id visualizado
- pending count bank login
