# LOG — Fix erro ao salvar edição (data de nascimento)

## Contexto

Ao editar usuário, o sistema mostrava "Não foi possível salvar as alterações do usuário.".
Um caso comum era digitar data como `23031981` (sem separadores), causando rejeição no backend.

## Correção aplicada

- `web/src/App.tsx`
  - criada função `normalizeBirthDateForApi` para aceitar:
    - `DD/MM/AAAA`
    - `DDMMAAAA` (converte para `DD/MM/AAAA`)
    - `AAAA-MM-DD` (converte para `DD/MM/AAAA`)
  - validação executada antes do `PUT /users/:id`.
  - mensagem de erro amigável quando formato estiver inválido.

## Resultado

- edição volta a salvar normalmente com data digitada de forma contínua (8 dígitos) ou no formato com barras.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `cd web && npm run build` — OK.
- lint sem erros.

## Palavras-chave

- erro salvar usuario
- birthdate ddmmaaaa
- normalizeBirthDateForApi
