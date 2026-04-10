# LOG — Usuários: semáforo ao lado do status

## Contexto

Solicitado exibir indicador visual de semáforo ao lado do status do usuário:

- Verde = Ativo
- Vermelho = Inativo
- Amarelo = Pendente

## Implementação

- `web/src/App.tsx`
  - Mantida função `formatUserLifecycleStatus`.
  - Adicionada função `userStatusClassName` para mapear classe de estilo por estado.
  - Célula de status alterada para renderizar componente inline:
    - texto do status
    - bolinha (`.user-status__dot`) com cor semafórica.

- `web/src/index.css`
  - Adicionados estilos:
    - `.user-status`
    - `.user-status__dot`
    - `.status--active`, `.status--inactive`, `.status--pending`
  - Cores aplicadas:
    - ativo: verde
    - inativo: vermelho
    - pendente: amarelo

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Validação

- `cd web && npm run build` — OK.
- Lint sem erros.

## Palavras-chave

- users status semaforo
- status dot active inactive pending
