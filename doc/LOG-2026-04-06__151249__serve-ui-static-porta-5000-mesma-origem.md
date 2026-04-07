# Contexto do pedido

Usuário quer validar telas localmente apenas em `http://127.0.0.1:5000/`, sem segundo servidor (Vite) e sem domínio publicado por agora.

# Ações executadas

- Ajuste do Express para servir `web/dist` após as rotas da API.
- Middleware final para SPA: `GET` sem extensão retorna `index.html`.
- Frontend passa a usar URL de API vazia por padrão (mesma origem).
- Scripts no `package.json`: `build:web`, `dev:ui`.
- Atualização do `README.md` com fluxo local único.
- Build de validação: `npm run build:web` e `npm run build`.

# Arquivos alterados

- `src/app.ts`
- `package.json`
- `README.md`
- `web/src/App.tsx`
- `web/.env.example`

# Como validar

1. `cd web && npm install` (uma vez).
2. Na raiz: `npm run dev:ui` (faz build da UI e sobe API com watch).
3. Abrir `http://127.0.0.1:5000/` e fazer login.

# Observações

- Após alterar código React, rodar `npm run build:web` de novo (ou usar `dev:ui` que rebuilda antes do watch).
- `npm run dev` sozinho não reconstrói o frontend automaticamente.

# Palavras-chave

- same-origin-ui
- express-static-web-dist
- porta-5000-unica
