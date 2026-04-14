# LOG: ícone discreto no rodapé com dados do usuário logado

## Contexto

Solicitado no menu lateral inferior um ícone discreto que exibe dados do usuário logado ao clicar:
- nome completo
- e-mail cadastrado
- CPF cadastrado

## Implementação

### `web/src/App.tsx`
- Novo estado: `isLoggedUserInfoOpen`.
- Novo helper: `formatCpfForDisplay(cpf)` para exibir CPF com máscara quando aplicável.
- Tipo `SessionUser` atualizado com `profile?.cpf`.
- Adicionado botão ícone discreto no rodapé (`logged-user-info-wrap`) e popover com os 3 dados.
- Fechamento automático por clique fora e tecla `Escape` integrado ao listener global.

### `web/src/index.css`
- Estilos do gatilho discreto (`shell-rail-profile-trigger`).
- Estilos do popover (`logged-user-info-popover`) e textos.

## Validação

- `npm run build --prefix web` (OK)
- Sem erros de lint.

## Palavras-chave

- menu lateral rodape usuario logado
- popover dados usuario
- cpf email nome no rail
