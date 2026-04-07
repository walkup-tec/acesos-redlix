# LOG: UI aero, mobile-first, menu recolhe, sem Dashboard

## Contexto

Ajuste visual do painel: remover Dashboard, corrigir logo distorcida, sair do sidebar escuro, estilo “aero” (vidro/cores suaves), menu recolhível no desktop e drawer no mobile.

## Ações executadas

- `web/index.html`: `lang="pt-BR"`, `viewport-fit=cover`, fonte Plus Jakarta Sans, título “Credilix Acessos”.
- `web/src/App.tsx`: `ModuleKey` sem `dashboard`; rota inicial `users`; shell com backdrop, aside glass, hamburger, pin recolher/expandir, título por módulo; logo com classes e dimensões para não esticar.
- `web/src/index.css`: tema aero (gradiente de fundo, glass/blur, cards claros), drawer fixo abaixo de 901px, sidebar em linha a partir de 901px com largura colapsada, `object-fit: contain` na logo.

## Arquivos alterados

- `web/index.html`
- `web/src/App.tsx`
- `web/src/index.css`

## Como validar

```powershell
Set-Location D:\Credilix-acessos\web
npm run build
```

Rodar `npm run dev:ui` na raiz do repo e testar em largura estreita (menu hamburger + overlay) e largura ≥901px (botão ⟨/⟩ para recolher).

## Segurança

Nenhum segredo alterado ou exposto.

## Palavras-chave

- ui aero glass mobile-first
- menu recolhe drawer hamburger
- logo object-fit contain
