# LOG — Modal fecha após salvar + máscaras CPF/data

## Contexto

Solicitado:

- fechar modal após salvar;
- aplicar máscara de data de nascimento e CPF no formulário de edição de usuário.

## Alterações

- `web/src/App.tsx`
  - após salvar com sucesso, além do `closeUserActionModal`, exibe `panelNotice` de sucesso;
  - máscara de CPF em tempo real: `000.000.000-00`;
  - máscara de data em tempo real: `DD/MM/AAAA`;
  - inputs configurados com `inputMode="numeric"` e placeholders adequados.

## Arquivo alterado

- `web/src/App.tsx`

## Validação

- `cd web && npm run build` — OK.
- lint sem erros.

## Palavras-chave

- modal fecha ao salvar
- mascara cpf
- mascara data nascimento
