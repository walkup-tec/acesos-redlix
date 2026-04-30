## Contexto do pedido

Excluir imediatamente o usuário de teste `mozart.pmo@gmail.com` para recriação posterior.

## Comandos solicitados pelo usuário / ações executadas

- Pesquisa rápida no código para confirmar inexistência de endpoint dedicado de exclusão de usuário.
- Execução de comando `node -e` no diretório do projeto para:
  - carregar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do `.env`;
  - consultar quantidade de usuários com e-mail `mozart.pmo@gmail.com` antes da remoção;
  - excluir registros em `users` por e-mail normalizado;
  - consultar novamente a quantidade após a remoção.

## Solução implementada (passo a passo)

1. Validado que o backend atual não expõe rota `DELETE /users/:id`.
2. Conectado ao Supabase com chave de serviço já configurada localmente no ambiente.
3. Executada exclusão por e-mail (`eq('email', 'mozart.pmo@gmail.com')`).
4. Confirmado resultado com verificação antes/depois:
   - antes: `1`
   - depois: `0`

## Arquivos criados/alterados

- `doc/LOG-2026-04-15__132615__delete-usuario-teste-por-email.md` (novo)
- `doc/memoria.md` (atualizado com resumo da operação)

## Como validar

1. Tentar login com `mozart.pmo@gmail.com` (deve falhar por usuário inexistente).
2. Consultar lista de usuários no painel (se houver permissão) e verificar ausência do e-mail.
3. (Opcional) Reexecutar consulta SQL/Supabase filtrando por `email = 'mozart.pmo@gmail.com'` e confirmar zero linhas.

## Observações de segurança

- Nenhum segredo foi exposto em commit/documentação.
- Operação executada com filtro explícito por e-mail para evitar deleção em massa.
- Não houve alteração de schema, autenticação ou permissões globais.

## Itens para evitar duplicação no futuro (palavras-chave)

- excluir usuário por email
- delete users supabase
- remover usuário de teste
- mozart.pmo@gmail.com
