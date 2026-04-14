# LOG: e-mail de ativação de usuário (Credilix)

## Contexto

Solicitado que, ao ativar usuário, o sistema envie e-mail com mensagem de boas-vindas e dados de acesso (URL + usuário + referência à senha cadastrada).

## Solução implementada

- Atualizado o fluxo pproveUser em src/services.ts.
- Novo assunto: Acesso ativado — Credilix.
- Novo corpo do e-mail:
  - saudação com nome completo;
  - confirmação de ativação;
  - link de acesso (APP_BASE_URL);
  - usuário (e-mail cadastrado);
  - senha informada como "a senha cadastrada por você".

## Segurança

- Senha em texto puro não é armazenada no banco; por isso o e-mail não expõe senha real, apenas referência à senha que o usuário já definiu.

## Arquivo alterado

- src/services.ts

## Validação

- 
pm run build (backend) executado com sucesso.

## Palavras-chave

- email ativacao usuario
- approveUser credilix
- senha cadastrada por voce
