# LOG — Usuários: ações por ícones na coluna Ação

## Contexto

Solicitação para substituir os botões textuais por ícones na coluna `Ação`:

- lápis: Editar
- pessoa cinza: Inativar
- X: Bloquear
- reset: Resetar

## Alterações

- `web/src/App.tsx`
  - Ações da linha de usuário passaram para ícones (Lucide):
    - `Pencil` (Editar)
    - `RotateCcw` (Resetar)
    - `UserMinus` (Inativar)
    - `XCircle` (Bloquear)
  - Mantidos `title` e `aria-label` em cada botão para acessibilidade.

- `web/src/index.css`
  - Botões compactos quadrados para ícones (`2.05rem`).
  - Cores alinhadas ao sistema:
    - base padrão para editar/reset.
    - variante cinza para inativar.
    - variante de alerta para bloquear.
  - Ajustes equivalentes para modo escuro.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Sem erros de lint.

## Palavras-chave

- users action icons
- editar reset inativar bloquear icones
- user inline icon buttons
