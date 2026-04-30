## Contexto do pedido

Login criado pelo líder para vendedor não aparecia na tela do vendedor.

## Causa raiz

A listagem para perfis não-líder/não-master estava filtrando apenas por `requester_user_id`.  
Quando o líder cria para um vendedor, o vendedor fica em `target_user_id`, então a consulta não retornava o registro.

## Solução aplicada

1. `listBankLoginRequests`
   - Perfil vendedor/suporte passa a listar por:
     - `requester_user_id = auth.userId` **ou**
     - `target_user_id = auth.userId`

2. `getPendingBankLoginRequestCount`
   - Para vendedor/suporte, contagem de notificação passou a considerar os dois vínculos acima.

3. `markBankLoginRequestViewed`
   - Passou a permitir marcação de visualização para quem é solicitante **ou** usuário-alvo (`target_user_id`).
   - Incluída validação de permissão explícita antes de atualizar.

## Arquivo alterado

- `src/services.ts`

## Validação

- `npm run build` OK
- `npm run build:web` OK

## Palavras-chave

- login banco vendedor nao lista
- target_user_id solicitacao
- visibilidade login criado por lider
