# LOG: busca de usuários — CPF com ou sem máscara

## Contexto

Na pesquisa da lista de usuários, o CPF pode ser digitado só com números ou com pontuação (`.` e `-`). Era necessário normalizar ambos os lados na comparação.

## Solução

- Arquivo: `web/src/App.tsx`
- Extração de dígitos da busca a partir do texto digitado (`trim`), sem depender só da string em minúsculas.
- Comparação CPF: `cpfDigitsOnly` vs `queryDigitsOnly` com `includes` nos dois sentidos quando ambos têm dígitos, cobrindo máscara no cadastro ou na busca.

## Validação

- `npm run build --prefix web` (OK)

## Palavras-chave

- busca cpf normalizada
- cpf pontos tracos digitos
