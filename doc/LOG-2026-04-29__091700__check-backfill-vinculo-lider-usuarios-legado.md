# LOG: validação/backfill de vínculo líder para usuários legados

## Contexto

Necessidade de garantir que usuários adicionados depois continuem vendo conteúdos pré-existentes do respectivo líder.

## Ações executadas

- Executado script de saneamento no Supabase para revisar `users`:
  - ignorar `MASTER` e `LIDER`;
  - para perfis de equipe (`VENDEDOR`/`SUPORTE`), inferir líder via `created_by_user_id`;
  - corrigir `leader_user_id` quando nulo, auto-referente ou divergente.
- Removido script temporário após execução.

## Resultado

- Registros analisados: `4`
- Registros corrigidos (`patched`): `0`

Conclusão: os vínculos atuais já estavam consistentes com a regra de equipe.

## Observação funcional

A visibilidade de conteúdo/tabela no backend é por escopo de equipe (IDs de criadores visíveis), não por data de criação; portanto conteúdos antigos do líder devem aparecer para membros novos quando o vínculo com o líder está correto.

## Segurança

- Operação feita via `SUPABASE_SERVICE_ROLE_KEY` local.
- Sem persistir scripts auxiliares no repositório.

## Palavras-chave

- backfill leader_user_id
- conteudo preexistente lider
- visibilidade equipe legado
