# Contexto do pedido

O usuário pediu dois ajustes no módulo de criação de tabela:

1. Exibir os campos na mesma linha com a sequência: **Produto - Banco - Tabela - Prazo - Observação**.
2. Adicionar o campo obrigatório **Banco**.

# Ações executadas

1. Ajustei o frontend para organizar os campos de criação em uma linha no desktop, mantendo quebra responsiva no mobile.
2. Mantive/validei o campo **Banco** como obrigatório no frontend com alerta explícito.
3. Mantive/validei o campo **Banco** como obrigatório na API (`zod`) e no serviço.
4. Mantive/validei persistência do campo `bank` no banco de dados.
5. Criei migration para adicionar `bank` em `commission_tables` e tornar `NOT NULL`.
6. Rodei build TypeScript do projeto para validar.

# Solução implementada (passo a passo)

1. `web/src/App.tsx`
   - Formulário de criação de tabela recebeu estrutura com `table-create-row`.
   - Ordem dos campos em linha: `Produto`, `Banco`, `Tabela`, `Prazo`, `Observação`.
   - `Banco` continua obrigatório no submit (`window.alert("Banco é obrigatório.")`).
   - Envio para API inclui `bank`.
   - Listagem já renderiza na ordem: `Produto | Banco | Tabela | Prazo | Observação`.

2. `web/src/index.css`
   - Adicionadas classes `.form-grid--table-create` e `.table-create-row`.
   - Em telas grandes, os 5 campos ficam na mesma linha com `grid-template-columns`.
   - Em telas menores, layout continua responsivo com quebra natural.

3. Backend e modelo
   - `src/types.ts`: `CommissionTable` com `bank: string`.
   - `src/routes.ts`: schema de `POST /commission-tables` exige `bank`.
   - `src/services.ts`: cria/salva/lista `bank`.

4. Banco de dados
   - `supabase/schema.sql`: coluna `bank text not null` em `commission_tables`.
   - Nova migration: `supabase/migration-2026-04-07-commission-table-bank-required.sql`.

# Arquivos alterados/criados

- `web/src/App.tsx`
- `web/src/index.css`
- `src/types.ts`
- `src/routes.ts`
- `src/services.ts`
- `supabase/schema.sql`
- `supabase/migration-2026-04-07-commission-table-bank-required.sql` (novo)

# Como validar

1. Rodar build:
   - `npm run build`
2. Abrir módulo **Tabela de Comissão**.
3. Verificar os campos do formulário na ordem:
   - Produto, Banco, Tabela, Prazo, Observação.
4. Tentar salvar sem banco:
   - Deve alertar `Banco é obrigatório.`
5. Criar tabela com banco preenchido:
   - Conferir na listagem colunas: `Produto | Banco | Tabela | Prazo | Observação`.

# Observações de segurança

- Nenhum segredo/token foi exposto em código.
- Validação do campo obrigatório ocorre no frontend e no backend.

# Palavras-chave (evitar duplicação futura)

- criacao de tabela banco obrigatorio
- produto banco tabela prazo observacao mesma linha
- commission_tables bank not null
- migration supabase bank commission table
