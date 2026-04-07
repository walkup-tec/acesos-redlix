# Contexto

Conflito com outros serviços na porta 5000; projeto passou a usar **5050** por padrão.

# Alterações

- `src/config.ts`: fallback `PORT` e `APP_BASE_URL` → 5050 / `http://localhost:5050`
- `.env.example`, `README.md`, `web/.env.example`, `web/README.md`, `doc/memoria.md`
- `.env` local: `PORT`, `APP_BASE_URL`, `BRANDING_LOGO_URL` alinhados à 5050

# Validar

- `npm run dev:ui` → `http://127.0.0.1:5050/` e `http://127.0.0.1:5050/api/health`

# Palavras-chave

- porta-5050
- conflito-porta-5000
