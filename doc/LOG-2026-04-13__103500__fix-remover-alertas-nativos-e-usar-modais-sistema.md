# LOG — remover alertas nativos e usar modais do sistema

## Contexto do pedido

Usuário reportou que ainda apareciam popups nativos do navegador e reforçou que todos os alertas devem seguir o estilo interno do sistema.

## Ações executadas

1. Mapeamento em `web/src/App.tsx` para localizar `window.alert` e `window.prompt`.
2. Remoção de todos os `window.alert`, mantendo feedback via estado de erro da UI (`setError`).
3. Substituição dos fluxos com `window.prompt` por modais do sistema:
   - edição de tabela de comissão;
   - edição de nome do produto.
4. Build do frontend com `npm run build:web` para atualizar `web/dist`.

## Arquivos alterados

- `web/src/App.tsx`

## Como validar

1. Abrir Tabela de Comissão.
2. Clicar em editar tabela e editar produto.
3. Confirmar que abre modal interno (não popup nativo do navegador).
4. Validar também fluxos de exclusão para garantir consistência visual.

## Segurança

- Nenhum segredo exposto.
- `.env` permanece fora do versionamento.

## Palavras-chave

- remover window alert prompt
- modal sistema tabela comissao
- ui padronizada sem popup navegador
