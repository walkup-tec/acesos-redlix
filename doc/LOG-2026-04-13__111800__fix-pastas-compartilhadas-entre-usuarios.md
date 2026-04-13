# LOG — fix pastas compartilhadas entre usuários

## Contexto do pedido

Pasta criada por MASTER (`Teste de Uso`) não aparecia para usuário VENDEDOR.

## Causa raiz

As pastas vazias eram mantidas apenas em `localStorage` (`manualFolders`) no frontend do usuário atual.  
Sem conteúdo real no backend, outros usuários do tenant não recebiam essa pasta.

## Solução implementada

1. Backend:
   - Novo endpoint `POST /api/contents/folder`.
   - Nova função `createContentFolder` em `src/services.ts`, persistindo marcador em `contents`:
     - `type: "FOLDER"`
     - `file_path: "__folder__/<path>"`
2. Tipagem:
   - `ContentType` atualizado com `"FOLDER"` em `src/types.ts`.
3. Frontend:
   - `handleCreateFolder` agora chama `POST /api/contents/folder` e faz `refreshAll`.
   - Itens marcadores (`type: "FOLDER"`) são excluídos da lista de arquivos e das contagens de arquivos da pasta.
   - Fallback legado mantido para ambiente antigo sem endpoint.

## Validação

- Build backend + frontend executado com sucesso.
- Teste de API:
  - `POST /api/contents/folder` retornou `201`.
  - `GET /api/contents` retornou item marcador `type: "FOLDER"` para a pasta criada.

## Arquivos alterados

- `src/services.ts`
- `src/routes.ts`
- `src/types.ts`
- `web/src/App.tsx`

## Palavras-chave

- pasta nao aparece vendedor
- conteudo folder marker
- contents folder endpoint
