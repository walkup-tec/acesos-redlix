## Contexto do pedido

O alerta de `Tabela de Comissão` para vendedor deve aparecer apenas após o líder definir repasse.

## Solução aplicada

Arquivo alterado: `web/src/App.tsx`

- Mantido realtime por evento `commission-tables-updated`.
- Para perfil `VENDEDOR`, a atualização agora calcula delta de tabelas visíveis:
  - carrega tabelas novas;
  - compara IDs atuais vs novos;
  - só incrementa alerta quando **novos IDs aparecem**.

Com isso:
- criação de tabela pelo master sem repasse (não aparece para vendedor) não gera alerta;
- quando líder define repasse e a tabela passa a aparecer para vendedor, gera alerta.

## Validação

- `npm run build:web` OK
- Sem erros de lint no arquivo alterado.

## Palavras-chave

- alerta comissao vendedor repasse
- delta tabelas visiveis
- commission tables updated sse
