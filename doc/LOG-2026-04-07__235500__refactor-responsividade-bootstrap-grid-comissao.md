# Contexto do pedido

Usuário pediu uso de Bootstrap para responsividade, com foco em mobile-first.

# Ações executadas

1. Adicionada dependência `bootstrap` no frontend.
2. Importado CSS oficial do Bootstrap em `web/src/main.tsx`.
3. Refatorado o módulo de `Tabela de Comissão` para usar grid Bootstrap (`row`/`col-*`).
4. Mantido comportamento atual dos campos (produto e banco novo/existente), alterando apenas estrutura responsiva.

# Solução implementada

- `web/src/main.tsx`
  - `import 'bootstrap/dist/css/bootstrap.min.css'`.

- `web/src/App.tsx`
  - No módulo de produtos/comissão:
    - container principal em `row g-3`;
    - formulário `col-12 col-xxl-5`;
    - listagem `col-12 col-xxl-7`;
    - campos do formulário com `col-12 col-md-6 col-xl-* col-xxl-*`.
  - Isso garante empilhamento no mobile e distribuição progressiva em telas maiores.

# Arquivos alterados

- `web/src/main.tsx`
- `web/src/App.tsx`
- `web/package.json`
- `web/package-lock.json`

# Como validar

1. Abrir módulo `Tabela de Comissão` no celular ou viewport estreito.
2. Confirmar que campos empilham sem sobreposição.
3. Aumentar largura da tela e confirmar quebra progressiva em múltiplas colunas.

# Palavras-chave

- bootstrap responsividade mobile first
- grid row col tabela comissao
- credilix layout bootstrap
