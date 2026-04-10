# LOG - Excluir pasta de conteúdos com confirmação

## Contexto do pedido

Adicionar um ícone de lixeira nas pastas para permitir exclusão com confirmação prévia.

## Ações executadas

- Implementado botão de exclusão por pasta na UI do módulo `Conteúdos`.
- Incluída confirmação com `window.confirm` antes da remoção.
- Criado endpoint backend `DELETE /api/contents/folder?path=<folderPath>`.
- Implementada regra de serviço para excluir conteúdos da pasta e subpastas no tenant atual.
- Atualizado fluxo frontend para remover pastas locais, resetar navegação quando necessário e recarregar dados.
- Executado build completo backend e frontend.

## Comandos executados

- `npm run build` (raiz `D:/Credilix-acessos`)
- `npm run build:web` (raiz `D:/Credilix-acessos`)

## Solução implementada (passo a passo)

1. UI das pastas foi refatorada para suportar ação secundária de lixeira.
2. Ao clicar na lixeira:
   - confirma com o usuário;
   - chama `DELETE /api/contents/folder` com o caminho da pasta;
   - remove entradas locais de `manualFolders` (pasta e descendentes);
   - retorna para raiz se a pasta atual foi excluída;
   - atualiza dados com `refreshAll()`.
3. Backend valida autenticação/permissão e remove registros de `contents` que pertençam ao caminho alvo.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`
- `src/services.ts`
- `src/routes.ts`

## Como validar

1. Abrir módulo `Conteúdos`.
2. Passar o mouse numa pasta e clicar no ícone de lixeira.
3. Confirmar exclusão no diálogo.
4. Verificar se a pasta e os arquivos vinculados desaparecem da lista.
5. Verificar que, ao cancelar no diálogo, nada é removido.

## Observações de segurança

- Exclusão sempre filtrada por `tenant_id`.
- Ação protegida por `requireAuth` e permissão de edição de conteúdos.
- Nenhum segredo/chave foi exposto em código ou logs.

## Palavras-chave (evitar duplicação)

- excluir pasta conteúdos
- lixeira confirmação
- delete contents folder
- delete por tenant
