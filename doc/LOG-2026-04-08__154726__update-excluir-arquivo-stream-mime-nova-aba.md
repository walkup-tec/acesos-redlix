# LOG - Excluir arquivo na pasta + abrir em nova aba com MIME correto

## Contexto do pedido

- Permitir excluir arquivos dentro da pasta (ícone lixeira + confirmação).
- Corrigir abertura em nova aba: o navegador baixava arquivo com tipo errado (upload Multer sem extensão → `Content-Type` incorreto).

## Solução implementada

1. **Backend**
   - `GET /api/contents/:id/file`: resolve arquivo pelo registro no banco, valida tenant, define `Content-Type` conforme `type` (PDF/PNG/JPEG/IMAGE) e `Content-Disposition: inline`.
   - `DELETE /api/contents/:id`: remove registro e tenta apagar o ficheiro em `uploads/` (basename seguro, sem path traversal).
2. **Frontend**
   - Abertura passa a usar `GET /api/contents/{id}/file` em vez de `/api/files/{nome}`.
   - Ícone de lixeira por linha de arquivo + modal de confirmação (mesmo padrão visual da exclusão de pasta).
   - Ícone PDF vs imagem baseado em `content.type` (não na extensão do path).

## Arquivos alterados

- `src/services.ts`
- `src/routes.ts`
- `web/src/App.tsx`
- `web/src/index.css`

## Como validar

1. Entrar numa pasta com arquivos.
2. Clicar no nome ou ícone: PDF/imagem deve abrir em nova aba com visualizador adequado.
3. Clicar na lixeira do arquivo → confirmar → item some da lista.
4. Reiniciar `npm start` se a API ainda estiver numa build antiga.

## Segurança

- Rotas com `requireAuth`; ficheiro só servido se `contents.id` pertencer ao `tenant_id` do token.
- Caminho no disco restrito ao diretório `uploads/`.

## Palavras-chave

- contents id file stream mime
- delete content by id
- multer sem extensao content-type
