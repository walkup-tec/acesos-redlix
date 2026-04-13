# LOG — fix login failed to fetch (API offline)

## Contexto do pedido

Usuário reportou erro no login com mensagem **"Failed to fetch"**.

## Diagnóstico executado

1. Validado endpoint local `http://127.0.0.1:5050/api/health`.
2. Resultado inicial: falha de conexão (API não estava em execução).
3. Subido backend local em `D:\Credilix-acessos` com `npm run dev`.
4. Revalidado `GET /api/health` com retorno OK.
5. Revalidado `POST /api/auth/login` com `master@credilix.local` e retorno de token/usuário.

## Causa raiz

Serviço backend local indisponível na porta esperada (`5050`), fazendo o frontend lançar `Failed to fetch`.

## Solução aplicada

- Inicialização do servidor local (`npm run dev`).
- Verificação de saúde e autenticação concluídas com sucesso.

## Como validar

1. Garantir backend rodando em `127.0.0.1:5050`.
2. Acessar tela de login e autenticar novamente.
3. Confirmar que não aparece mais `Failed to fetch`.

## Segurança

- Nenhuma chave/segredo exposto em logs de documentação.
- `.env` permanece fora do versionamento.

## Palavras-chave

- failed to fetch login
- api health 5050
- credilix backend offline
- auth login master credilix
