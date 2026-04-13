# LOG — modal de detalhes do usuário ao clicar na linha

## Contexto

Solicitado: ao clicar na linha do cadastro na tabela de usuários, abrir modal com todas as informações preenchidas pelo usuário e documentos/imagens enviados.

## Implementação

1. `web/src/App.tsx`
   - Novo estado `selectedUserDetails`.
   - Clique na linha (`tr`) da tabela abre modal de detalhes em modo leitura.
   - Botões de ação da coluna (`editar/reset/aprovar/bloquear`) usam `stopPropagation` para não abrir o modal de detalhes ao clicar nos ícones.
   - Modal exibe:
     - dados de perfil e status;
     - dados cadastrais pessoais e endereço;
     - seção de documentos com botões para abrir arquivo:
       - documento frente;
       - documento verso;
       - comprovante de residência.
   - Reaproveitado `openUserUploadedFile` para abertura segura dos anexos.

2. `web/src/index.css`
   - Classe `.users-row-clickable` para feedback visual de linha clicável (`cursor: pointer`).

## Validação

- Build frontend executado com sucesso (`npm run build:web`).
- Sem erros de lint nos arquivos alterados.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Palavras-chave

- modal detalhes usuario
- clique linha tabela usuarios
- visualizar documentos cadastro
