## Contexto do pedido

Aplicar regra de negócio para impedir criação de solicitação duplicada de login:
- mesmo usuário
- mesmo banco
- mesmo produto

Com retorno de mensagem clara para alertar quando não for possível criar.

## Ações executadas

- Implementada validação de duplicidade no backend (`service`) antes da criação.
- Adicionado tratamento de corrida por violação de índice único (`23505`) com mensagem amigável.
- Adicionada proteção no schema com índice único por tenant/usuário/produto/banco (normalizado).

## Solução implementada

1. `src/services.ts` (`createBankLoginRequest`)
   - Resolve usuário-alvo da solicitação.
   - Consulta solicitações existentes com mesmo `tenant_id`, `product_id` e `target_user_id`.
   - Compara `bank_name` de forma case-insensitive.
   - Se existir, lança:
     - `Já existe login solicitado para este usuário no mesmo banco e produto.`
   - Em caso de corrida, captura erro de banco `23505` e retorna a mesma mensagem.

2. `supabase/schema.sql`
   - Criado índice único:
     - `idx_bank_login_requests_unique_user_product_bank`
     - chave: `tenant_id`, `coalesce(target_user_id, requester_user_id)`, `product_id`, `lower(bank_name)`

## Arquivos alterados

- `src/services.ts`
- `supabase/schema.sql`

## Como validar

1. Criar uma solicitação para usuário X, banco Y, produto Z.
2. Tentar criar novamente com os mesmos dados.
3. Confirmar bloqueio com alerta:
   - `Já existe login solicitado para este usuário no mesmo banco e produto.`

## Observações de segurança

- Regra aplicada no backend (não depende apenas da UI).
- Integridade reforçada com índice único no banco.
- Escopo multi-tenant preservado por `tenant_id`.

## Palavras-chave

- login banco duplicado
- usuario banco produto unico
- alerta solicitacao ja existente
