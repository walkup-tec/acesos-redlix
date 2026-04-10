# LOG — Data de nascimento em DD/MM/AAAA

## Contexto

Solicitado padronizar o formato de data de nascimento para `DD/MM/AAAA`.

## Ajustes

### Frontend

- No modal `Editar usuário`:
  - campo de data agora exibe placeholder `DD/MM/AAAA`.
  - ao abrir o modal, datas vindas como `YYYY-MM-DD` são convertidas para `DD/MM/AAAA` para edição.

### Backend

- Criada normalização robusta para `birthDate`:
  - aceita `DD/MM/AAAA` (padrão novo)
  - mantém compatibilidade com `YYYY-MM-DD` (legado)
  - converte e grava no banco em `YYYY-MM-DD`
  - valida datas inválidas e retorna erro claro.
- Aplicada na edição de usuário e no fluxo de conclusão de cadastro.

## Arquivos alterados

- `src/services.ts`
- `web/src/App.tsx`

## Validação

- `npm run build` (backend) — OK
- `cd web && npm run build` (frontend) — OK
- lint sem erros

## Palavras-chave

- birthDate dd/mm/aaaa
- normalizacao data nascimento
- editar usuario data formato
