# AGENTS.md

App Expo SDK 57 (React Native 0.86) organizado por feature com MVVM, design system próprio sobre
Expo UI, TanStack Query (cache persistido no MMKV), Zustand, Jest e Maestro. Imports usam o alias
`@/` e apontam para o arquivo que define o símbolo, sem barrels.

A dependência aponta em uma única direção: `shared` ◄ `features` ◄ `bootstrap` ◄ navegação.
Dentro de uma feature: `views` ► `view-models` ► `data` ► `model`.

Antes de alterar código, leia:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TESTS.md`](docs/TESTS.md)

Regras essenciais:

- a View só fala com a ViewModel (um hook por tela), que devolve estado pronto para exibir e
  ações;
- regras de negócio ficam no modelo, em funções puras; dado em cache é serializável (tempo em
  ISO 8601);
- repositório é um contrato (`interface`) com implementações e um fake; só `src/bootstrap`
  cria implementações e escolhe qual roda;
- a ViewModel recebe dependências pelo provider da feature, nunca importando implementações;
- a tela traduz erros pelo `code`, nunca pela mensagem;
- dado do servidor no TanStack Query; Zustand só para estado de cliente;
- telas não conhecem navegação (recebem callbacks) nem `@expo/ui` (usam `src/shared/components`);
- features não importam umas às outras; `shared` não conhece features;
- testes ficam ao lado do código e usam fakes; mocks sobre contratos do projeto são proibidos;
- textos para o usuário em inglês e português, via i18n;
- o portão de entrega é `npm run verify`.
