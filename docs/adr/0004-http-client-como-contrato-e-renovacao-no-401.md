# 0004. HttpClient como contrato e renovação no 401

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Com login, cada pedido precisa do token da sessão, e o token expira. Quando vários pedidos recebem
`401` ao mesmo tempo, cada um tentaria renovar sozinho, e o provedor de identidade recusaria as
renovações repetidas.

## Decisão

`HttpClient` é um contrato (`src/shared/http/http-client.ts`), e `FetchHttpClient` é a
implementação sobre o `fetch`. Com `session` (o token e a função que o renova), o cliente:

- manda `Authorization: Bearer <token>`;
- no `401`, liga um semáforo (`AccessTokenGate`): o primeiro renova, os outros esperam na fila, e
  todos são refeitos uma vez com o token novo;
- quando a renovação não traz token, avisa `onSessionEnded` e devolve o `401`.

O pedido aceita `headers`, `timeoutMs` e `signal`; cancelar vira `network.cancelled`.

## Alternativas consideradas

- **Contrato com semáforo no cliente (escolhida):** os repositórios não sabem de sessão, e a
  renovação acontece uma vez só.
- **Interceptores do axios:** a mesma ideia, com uma dependência a mais.
- **Renovar antes de cada pedido:** chamadas desnecessárias ao provedor.

## Consequências

- A função de renovação não pode usar o mesmo `HttpClient`, ou fica presa na própria fila.
