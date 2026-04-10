# Contexto do pedido

Usuário reportou que o modo escuro ficou ruim (contraste baixo e logo não aparecendo).

# Ações executadas

1. Corrigi a origem da logo do modo escuro para asset servido pelo backend.
2. Copiei a logo light oficial para `public/branding`.
3. Recalibrei tokens visuais do dark mode (fundo, cards, texto, bordas).
4. Ajustei componentes críticos no dark (header, menu ativo, inputs/selects, botão de tema).
5. Rebuild do frontend e restart da aplicação para garantir bundle atualizado.

# Solução implementada

- `web/src/App.tsx`
  - `DARK_LOGO_URL` trocado de `file:///...` para `/branding-assets/logo-credilix-light.png`.
  - `activeLogoUrl` com fallback robusto.
  - Botão de tema com label curto e `aria-label` adequado.

- `public/branding/logo-credilix-light.png`
  - Arquivo copiado de `D:\Site Credilix\dist\logo-credilix-light.png`.

- `web/src/index.css`
  - Paleta dark revisada para melhor contraste e legibilidade.
  - Estados do menu/sidebar melhorados.
  - Inputs/selects no dark com fundo e borda adequados.
  - Botão de tema com estilo de CTA mais visível.

# Arquivos alterados/criados

- `web/src/App.tsx`
- `web/src/index.css`
- `public/branding/logo-credilix-light.png` (novo)

# Como validar

1. Abrir `http://127.0.0.1:5050`.
2. Alternar para modo escuro.
3. Confirmar:
   - logo visível no login/menu;
   - contraste legível em textos e campos;
   - botão de tema visível;
   - menu ativo com destaque claro.

# Observações de segurança

- Nenhum segredo exposto.
- Alterações restritas ao frontend/asset público.

# Palavras-chave

- fix dark mode contraste
- logo light branding-assets
- ux ui tema escuro credilix
