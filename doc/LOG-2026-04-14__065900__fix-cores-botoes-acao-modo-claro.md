# LOG: correção de cores dos botões de ação no modo claro

## Contexto

No módulo de usuários, os botões de ação (reset/aprovar/inativar/bloquear) ficavam sem coloração no tema claro por conflito de especificidade com estilos base (`.btn-secondary`).

## Ações executadas

- Ajuste de seletores em `web/src/index.css` para maior especificidade (`.user-inline-btn.user-inline-btn--*`).
- Mantidos os mesmos tokens visuais e estados de hover, apenas garantindo prevalência no tema claro e consistência no tema escuro.

## Arquivo alterado

- `web/src/index.css`

## Como validar

1. Abrir módulo Usuários no tema claro.
2. Verificar cores nos botões: reset (azul), aprovar (verde), inativar (amarelo), bloquear (vermelho).
3. Alternar para tema escuro e confirmar que os estados continuam corretos.

## Segurança

- Sem alterações de backend/credenciais.

## Palavras-chave

- user-inline-btn modo claro
- especificidade css botoes acao
