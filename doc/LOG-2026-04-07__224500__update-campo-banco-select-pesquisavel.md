# Contexto do pedido

Após subir a lista de bancos via internet, o usuário pediu para converter para **select pesquisável**.

# Ações executadas

1. Ajustei o campo `Banco` no frontend para modo pesquisável:
   - input de busca (`Buscar banco...`)
   - select obrigatório com opções filtradas em tempo real.
2. Mantive a origem dinâmica dos bancos (BrasilAPI) + fallback local.
3. Mantive validação de obrigatoriedade do banco no submit.
4. Rodei build e lint.

# Solução implementada

- `web/src/App.tsx`
  - Novo estado `bankSearch`.
  - Novo `filteredBankOptions` com `useMemo`.
  - Campo `Banco` agora usa bloco `bank-select` com:
    - `input` para filtro;
    - `select` obrigatório para seleção.
  - Ao salvar com sucesso, também limpa `bankSearch`.

- `web/src/index.css`
  - Classe `.bank-select` para organizar busca + select.

# Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

# Como validar

1. Abrir módulo **Tabela de Comissão**.
2. No campo **Banco**, digitar parte do nome/código.
3. Confirmar que o `select` reduz opções conforme busca.
4. Selecionar banco e salvar normalmente.
5. Tentar salvar sem selecionar banco para validar bloqueio/obrigatoriedade.

# Palavras-chave

- select pesquisavel banco
- filtro bancos tempo real
- tabela comissao banco obrigatorio
