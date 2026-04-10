# LOG - Correção exclusão de arquivo (Supabase + Windows + mensagem API)

## Problema

Exclusão de arquivo falhava com mensagem genérica no painel; possíveis causas: servidor sem rota nova, erro PostgREST não serializado como `Error`, validação de path em Windows.

## Alterações

- `deleteContentById`: erros do Supabase convertidos para `Error` com mensagem legível; exclusão no banco antes de remover ficheiro em disco; validação de path em Windows com prefixo case-insensitive.
- `getContentFileForDownload`: mesmo tratamento de erro na leitura.
- Rota `DELETE /api/contents/:id`: log no servidor e mensagem segura no JSON.
- Frontend: lê corpo como texto e faz parse JSON opcional; se falhar, mostra HTTP status e lembrete de reiniciar API.

## Palavras-chave

- delete contents id supabase message
- windows uploads path assert
