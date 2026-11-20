# 0008. Mudanças otimistas por padrão

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Esperar o servidor a cada toque deixa o app lento em rede ruim, e a maioria das escritas quase
nunca falha.

## Decisão

Escrita é otimista por padrão: a mutation do TanStack Query muda o cache no toque (`onMutate`),
guarda o anterior e volta na falha (`onError`), com um aviso "Tentar de novo". No fim, as consultas
afetadas são invalidadas.

Esperam a resposta, com o botão em andamento:

- formulário, porque a recusa volta ao campo;
- dado criado pelo serviço (id, número, data do servidor);
- ação sem volta (excluir conta, pagar).

## Consequências

- Cada mutation otimista tem teste da volta na falha.
