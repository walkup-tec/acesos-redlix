# Contexto do pedido

O usuário pediu para "subir uma listagem de bancos" atualizada do Brasil no campo **Banco** da criação de tabela.

# Comandos e ações executadas

- Pesquisa de fonte atualizada na internet.
- Consulta ao endpoint público `https://brasilapi.com.br/api/banks/v1`.
- Ajuste do frontend para carregar a lista automaticamente e sugerir no campo Banco.
- Build e validação de lint.

# Solução implementada

1. Fonte de dados
   - Integrado carregamento em tempo real da lista de bancos via BrasilAPI (`/api/banks/v1`), que usa dados públicos de instituições financeiras.

2. UI/UX do campo Banco
   - Campo `Banco` permanece obrigatório.
   - Agora usa `input` com `datalist`:
     - permite selecionar rapidamente da lista;
     - mantém flexibilidade para digitar manualmente.

3. Resiliência
   - Adicionado fallback local com bancos principais (caso falhe a chamada externa).
   - `AbortController` para cancelar request ao desmontar componente.

# Arquivos alterados

- `web/src/App.tsx`

# Como validar

1. Abrir módulo **Tabela de Comissão**.
2. No campo **Banco**, digitar e verificar sugestões automáticas.
3. Confirmar que sem preencher **Banco** o sistema alerta obrigatoriedade.
4. Criar tabela e validar persistência/visualização com banco selecionado.

# Observações de segurança

- Nenhum segredo foi adicionado.
- Consumo de endpoint público sem chave.
- Em falha de rede, há fallback local para não quebrar fluxo crítico.

# Palavras-chave

- lista atualizada bancos brasil
- brasilapi banks v1
- datalist banco obrigatorio
- fallback bancos frontend
