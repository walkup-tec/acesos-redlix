# LOG: correção de visibilidade vendedor herdando escopo do líder

## Contexto

Cenário reportado: líder `mozart.hotmart@gmail.com` criou conteúdo, mas o vendedor da sua equipe (`somaconecta@gmail.com`) não visualizava esse conteúdo.

## Causa raiz identificada

Em casos de dados legados/inconsistentes, `leader_user_id` do vendedor podia ficar apontando para ele mesmo.  
Na resolução de escopo, isso bloqueava a herança correta do líder da equipe.

## Solução implementada

1. Ajuste na regra de resolução de líder em `src/services.ts`:
   - Para usuários não líderes, só aceita `leader_user_id` quando diferente do próprio `id`.
   - Prioriza o criador (`created_by_user_id`) quando ele é `LIDER`.
   - Usa fallback para `leader_user_id` do criador quando aplicável.

2. Correção de dados no banco para o caso reportado:
   - `somaconecta@gmail.com` atualizado com:
     - `created_by_user_id = <id do líder mozart>`
     - `leader_user_id = <id do líder mozart>`

## Arquivos alterados

- `src/services.ts`
- `doc/LOG-2026-04-29__085800__fix-visibilidade-vendedor-herdar-conteudo-do-lider.md`
- `doc/memoria.md`

## Validação executada

- Build backend: `npm run build` (ok).
- Lint/diagnóstico em `src/services.ts` sem erros.
- Verificação SQL pós-update confirmou vínculos do vendedor para o líder.

## Segurança

- Ajuste feito apenas no tenant e usuários envolvidos.
- Script temporário local foi removido após execução.

## Palavras-chave

- visibilidade vendedor lider
- leader_user_id self fix
- escopo equipe conteudos
