# Contexto do pedido

Usuário solicitou criação de **modo escuro** no sistema e, nesse modo, troca da logo para:

- `D:\Site Credilix\dist\logo-credilix-light.png`

# Ações executadas

1. Adicionado estado de tema (`light`/`dark`) no frontend.
2. Persistência do tema no `localStorage`.
3. Aplicação do tema via `data-theme` no `body`.
4. Criação de botão de alternância no header (`Modo escuro` / `Modo claro`).
5. Troca de logo no tema escuro para o arquivo informado.
6. Ajuste de variáveis CSS para paleta escura.
7. Build e lint executados.

# Solução implementada (passo a passo)

- `web/src/App.tsx`
  - Novas constantes:
    - `THEME_STORAGE_KEY`
    - `DARK_LOGO_URL` (apontando para `file:///D:/Site%20Credilix/dist/logo-credilix-light.png`)
  - Nova função `readStoredTheme()`.
  - Novo estado `theme`.
  - `useEffect` para:
    - gravar tema em `localStorage`;
    - aplicar `document.body.dataset.theme`.
  - `activeLogoUrl` alterna entre logo padrão e logo light no modo escuro.
  - Header ganhou botão `theme-toggle`.

- `web/src/index.css`
  - Novo bloco `body[data-theme="dark"]` com sobrescrita de variáveis visuais.
  - Fundo dark com gradiente.
  - Estilo do botão `.theme-toggle`.

# Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

# Como validar

1. Abrir o sistema e clicar no botão de tema no header.
2. Confirmar:
   - visual dark aplicado (cards, fundo, contraste);
   - logo alterada no modo escuro.
3. Recarregar página e conferir persistência do tema.

# Observações de segurança

- Sem inclusão de segredos ou chaves.
- Mudança é puramente de interface/frontend.

# Palavras-chave

- modo escuro credilix
- troca logo dark theme
- localstorage tema ui
