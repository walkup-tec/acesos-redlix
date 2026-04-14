# LOG: botão atualizar no módulo de usuários

## Contexto

Solicitado botão "Atualizar" na página de usuários para evitar recarregar o navegador.

## Solução implementada

- Adicionado botão `Atualizar` no toolbar do card de usuários.
- Ação do botão chama endpoint `GET /api/users` e atualiza apenas a lista de usuários.
- Estado de loading dedicado durante atualização (`Atualizando...`).
- Exibição de aviso de sucesso no painel: `Lista de usuários atualizada.`

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `npm run build --prefix web` (OK)
- Sem erros de lint nos arquivos alterados.

## Segurança

- Reuso do token já autenticado via header `Authorization`.
- Sem exposição de segredos.

## Palavras-chave

- botao atualizar usuarios
- refresh lista usuarios
- card toolbar usuarios
