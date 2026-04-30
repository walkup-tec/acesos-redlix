## Contexto do pedido

Adicionar sistema de alertas para `Usuários`, `Tabela de Comissão` e `Conteúdos`, espelhando o padrão já existente (badge no menu lateral e ícones no topo com os mesmos ícones do menu).

## Ações executadas

- Frontend atualizado para manter contadores de alerta por módulo.
- Eventos SSE agora incrementam contador apenas do módulo impactado.
- Badges do menu lateral renderizam para todos os módulos com alerta.
- Topo passou a exibir ícones dos módulos permitidos (mesmos ícones do menu) com respectivas quantidades.

## Solução implementada

1. `web/src/App.tsx`
   - Novo estado `moduleAlertCounts` para:
     - `users`
     - `products`
     - `contents`
   - Helper `getModuleAlertCount(module)` para unificar badge (incluindo `bankLogins` via pendência já existente).
   - Ao abrir um módulo (`users/products/contents`), o contador dele é zerado.
   - Listener SSE:
     - `users-updated` incrementa alerta de usuários (se não estiver no módulo ativo).
     - `commission-tables-updated` incrementa alerta de comissão.
     - `contents-updated` incrementa alerta de conteúdos.
   - Menu lateral:
     - badge agora usa `getModuleAlertCount` para qualquer módulo.
   - Header:
     - substituído sino único por grupo de ícones (`navItems`) usando o mesmo `RailModuleIcon` do menu.
     - cada ícone mostra badge da quantidade correspondente.

2. `web/src/index.css`
   - Nova classe `.shell-header__alerts` para layout horizontal dos ícones no topo.

## Arquivos alterados

- `web/src/App.tsx`
- `web/src/index.css`

## Como validar

1. Abrir duas sessões no mesmo tenant.
2. Em uma sessão, criar/editar/excluir registros de:
   - usuários
   - comissão
   - conteúdos
3. Na outra sessão, confirmar:
   - badge no menu lateral do módulo correspondente;
   - badge no ícone correspondente no topo;
   - ao abrir o módulo, contador é limpo.

## Observações de segurança

- Nenhum dado sensível foi exposto.
- Alertas são derivados de eventos SSE por tenant.

## Palavras-chave

- alertas por modulo
- badge topo menu lateral
- icones iguais menu no topo
- users commission contents realtime
