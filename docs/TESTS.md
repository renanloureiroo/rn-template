# Testes do app

Este documento define como provar o comportamento de um app criado a partir deste template. Ele
complementa [ARCHITECTURE.md](ARCHITECTURE.md): a arquitetura descreve as camadas; este documento
define o teste adequado para cada uma.

O objetivo não é maximizar cobertura por métrica. É manter regras de negócio, contratos com a API
e comportamentos de tela protegidos com o teste mais barato capaz de demonstrar cada um.

---

## 1. Princípios

### Fakes, não mocks

Todo contrato do projeto tem uma implementação de teste real: `FakeNotesRepository`,
`InMemoryKeyValueStorage`, `FakeFetch`. Mock sobre contrato do projeto é proibido: nada de
`jest.fn()`, `jest.mock()` ou `jest.spyOn()` sobre repositórios, `KeyValueStorage`,
`HttpClient`, ViewModels ou stores.

É isso que a arquitetura compra: como a ViewModel recebe o contrato pelo provider da feature,
trocar a implementação real pelo fake é passar outro objeto, sem mexer no módulo nem interceptar
import.

Uma ViewModel é testada pelo estado que devolve e pelo estado do fake depois da ação, não por
`expect(repository.create).toHaveBeenCalled()`. Uma tela é testada pelo que aparece, não por
qual hook foi chamado.

### Fronteiras de terceiros

Mock só é aceitável na fronteira de uma biblioteca de terceiro, quando o fake real custaria mais
do que a integração verificada. As únicas do template, todas em `test/setup.ts` e
`jest.config.js`:

| Fronteira                          | Tratamento                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `@expo/ui` (SwiftUI/Compose)       | fake com primitivas RN em `test/support/expo-ui-fake.tsx`, tipado pelas props |
| `expo-localization`                | idioma fixo em pt-BR                                                          |
| `react-native-keyboard-controller` | mock oficial da própria biblioteca                                            |
| `react-native-gesture-handler`     | `jestSetup` oficial da própria biblioteca                                     |
| `react-native-nitro-modules`       | stub de import; o MMKV usa o próprio modo de teste em memória                 |
| `fetch`                            | injetado no `HttpClient` (`FakeFetch`), sem mock global                       |

Qualquer fronteira nova entra nesta tabela.

### Contrato do erro

Testes de modelo, repositório e `HttpClient` afirmam classe, `type` e `code`, nunca a mensagem
técnica:

```ts
const error = captureError(() => validateNoteTitle(""))

expect(error).toBeInstanceOf(AppError)
expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: "note.title_invalid" })
```

O texto exato só é contrato onde o usuário o vê: testes de ViewModel, de tela e de
`errorMessageOf`, que afirmam a tradução em português.

### Teste mais barato primeiro

Combinações de entrada e limites pertencem aos testes do modelo. Estados e ações da tela
pertencem aos testes da ViewModel, que não renderizam nada. A tela só é renderizada para provar
que desenha cada estado e liga cada ação.

## 2. Tipos de teste

| Camada      | Renderiza? | Ferramenta                               | O que prova                              |
| ----------- | ---------- | ---------------------------------------- | ---------------------------------------- |
| Modelo      | não        | Jest                                     | regras e limites                         |
| Repositório | não        | `HttpClient` + `FakeFetch` / `InMemory…` | requisição, mapeamento, erros, ordem     |
| Store       | não        | store vanilla                            | ações e isolamento                       |
| ViewModel   | hook       | `renderHook` + `createNotesTestSetup`    | estados, ações e efeito no fake          |
| View        | sim        | `renderNotesScreen` + Testing Library    | o que o usuário vê e cada ação ligada    |
| `shared`    | não        | Jest                                     | HTTP, retry, mensagens, paginação        |
| Composição  | não        | Jest                                     | qual implementação roda em cada ambiente |
| E2E         | app real   | Maestro                                  | fluxo crítico no simulador               |

## 3. Onde ficam

Testes ficam ao lado do arquivo testado (`note.ts` → `note.test.ts`). Apagar uma feature apaga
os testes dela.

```text
src/features/notes
├── model/note.test.ts
├── data/remote-notes-repository.test.ts
├── data/local-notes-repository.test.ts
├── stores/note-draft-store.test.ts
├── view-models/use-note-list-view-model.test.tsx
├── views/NoteListScreen.test.tsx
└── testing                         # só para testes
    ├── fake-notes-repository.ts
    ├── note-fixtures.ts            # aNote({ title: "..." })
    └── notes-test-setup.tsx        # createNotesTestSetup, renderNotesScreen

test
├── setup.ts                        # fronteiras de terceiro, i18n em pt-BR
└── support                         # utilidades que não são de nenhuma feature
    ├── capture-error.ts
    ├── expo-ui-fake.tsx
    ├── fake-fetch.ts
    ├── in-memory-key-value-storage.ts
    └── test-providers.tsx          # tema, safe area, gestos e QueryClient de teste
```

Código do app nunca importa `test/` nem `testing/` (regra `no-test-code-in-app` do
dependency-cruiser). A suíte roda com `TZ=UTC` e em pt-BR, com as traduções reais.

## 4. Convenções

- arquivo: `<alvo>.test.ts` ou `<Tela>.test.tsx`;
- `describe` com o nome do alvo; `it` em português descrevendo comportamento;
- sujeito sob teste chamado `sut` quando montado no `beforeEach`;
- famílias de entrada em `it.each`;
- montagem, ação e asserção separadas por linha em branco;
- sem comentários `given/when/then` que apenas repitam a estrutura;
- nenhum `it.skip`, `it.only` ou `it.todo` sem justificativa escrita;
- na Testing Library 14, `render`, `renderHook`, `fireEvent` e `act` são assíncronos: sempre
  `await`;
- todo teste espera a última atualização que provocou (`waitFor`), para não deixar estado
  pendente fora de `act`.

## 5. Modelo

Regras de negócio são funções puras, testadas direto:

- valores válidos e inválidos, incluindo ausência e só espaços;
- os dois lados de cada limite (`120` passa, `121` falha);
- `type` e `code` de cada erro.

## 6. Repositórios

O repositório remoto é testado com o `HttpClient` real e um `FakeFetch` roteirizado:

```ts
server.respondWithProblem(404, { code: "note.not_found" })

await expect(sut.findById("123")).resolves.toBeNull()
```

Para cada repositório remoto, prove: método, URL e corpo enviados; mapeamento da resposta;
tradução de protocolo (404 → `null`); propagação dos demais erros; falha quando o servidor quebra
o contrato.

O repositório local é testado com `InMemoryKeyValueStorage`, gerador de id e relógio
determinísticos, inclusive persistência entre duas instâncias.

O `HttpClient` prova o contrato com o backend: cada status vira o `ErrorType` certo, o `code` do
RFC 9457 é preservado, os códigos reservados entram quando o corpo não traz `code`, e falha de
conexão e timeout viram `network.*`.

O fake (`testing/fake-<feature>-repository.ts`) implementa o mesmo contrato e preserva o
comportamento relevante: quem atribui identidade, ordem, paginação. Ele ganha capacidades de
teste explícitas (`add`, `all`, `failNextWith`) em vez de spies.

A escolha de implementação por ambiente é provada em `src/bootstrap/app-dependencies.test.ts`.

## 7. ViewModels

A ViewModel é testada com `renderHook` dentro da feature montada com fakes:

```ts
const setup = createNotesTestSetup()
setup.notes.add(aNote({ title: "Comprar café", createdAt: "2026-03-10T12:00:00.000Z" }))

const { result } = await renderHook(() => useNoteListViewModel(), { wrapper: setup.wrapper })

await waitFor(() => expect(result.current.state.status).toBe("ready"))
expect(result.current.state).toMatchObject({
  notes: [{ title: "Comprar café", createdAt: "10 mar 2026" }],
})
```

`createNotesTestSetup()` devolve o fake do repositório, a store do rascunho e o `QueryClient` do
teste, para semear antes e afirmar depois. Cada ViewModel cobre:

- cada estado (`loading`, `error`, `empty`, `ready`) e o dado exato que ele carrega;
- cada ação e o efeito no fake e no cache;
- regra do modelo barrando I/O (o fake continua vazio);
- falha da fonte (`notes.failNextWith(networkUnavailable(...))`) e a mensagem traduzida.

## 8. Stores

Stores Zustand são testadas sem React, pela instância vanilla:

```ts
const sut = createNoteDraftStore()

sut.getState().actions.changeTitle("Comprar café")

expect(sut.getState().title).toBe("Comprar café")
```

Prove ações, estado inicial, estabilidade da referência de `actions` e isolamento entre
instâncias.

## 9. Views

`renderNotesScreen` monta a tela dentro da mesma feature, com fakes:

```tsx
const notes = new FakeNotesRepository()
notes.add(aNote({ title: "Comprar café" }))

await renderNotesScreen(
  <NoteListScreen onOpenNote={(id) => opened.push(id)} onCreateNote={() => {}} />,
  { notes },
)

expect(await screen.findByText("Comprar café")).toBeOnTheScreen()
```

- o `QueryClient` do teste não repete falhas e não agenda coleta de lixo;
- callbacks de navegação são funções que registram a intenção (`opened.push(id)`), não mocks;
- asserções usam o texto em português que o usuário vê;
- `testID` só onde o texto não identifica o elemento (campos, itens de lista);
- cada tela prova que desenha cada estado da ViewModel e que cada ação está ligada. A variação
  fina de estado fica no teste da ViewModel.

O Expo UI renderiza pelo fake de `test/support/expo-ui-fake.tsx`. Ele cobre só o subconjunto
usado pelo design system; um componente Expo UI novo no design system exige o fake
correspondente.

## 10. E2E com Maestro

Fluxos em `.maestro/flows` rodam contra um development build no simulador:

```bash
npm run ios            # ou npm run android, uma vez para instalar o build
npm run test:e2e
```

`_OnFlowStart` abre o app com estado limpo (MMKV vazio) e atravessa o launcher do dev client.
Fluxos usam textos em português e inglês (`"Salvar|Save"`), para não depender do idioma do
simulador. E2E cobre só fluxos críticos; combinações pertencem aos testes de modelo e de
ViewModel.

## 11. Ordem de escrita

| Passo | Produção                     | Teste que vem antes                     |
| ----: | ---------------------------- | --------------------------------------- |
|     1 | modelo                       | regras e limites                        |
|     2 | contrato do repositório      | fake que o implementa                   |
|     3 | implementação do repositório | `FakeFetch` / `InMemoryKeyValueStorage` |
|     4 | composição                   | implementação por ambiente              |
|     5 | store                        | store vanilla                           |
|     6 | ViewModel                    | `renderHook` + fake                     |
|     7 | View                         | `renderNotesScreen`                     |
|     8 | fluxo crítico                | Maestro                                 |

Uma correção de bug começa com um teste vermelho que reproduz o defeito.

## 12. Execução

```bash
npm test                                          # Jest
npm run verify                                    # portão de entrega
npm run test:watch
npx jest src/features/notes/model/note.test.ts
npm run test:e2e                                  # Maestro, exige simulador com o app instalado
```

O portão antes de merge é `npm run verify`: lint, regras de arquitetura, typecheck, testes e
bundle de iOS e Android. Nenhum teste pode ser ignorado para fazer o portão passar.

## 13. Checklist de review

- [ ] Nenhum mock sobre contrato do projeto; fronteira de terceiro nova está na tabela da seção 1.
- [ ] Erros afirmados por `type` e `code`; texto só onde o usuário o vê.
- [ ] Dados vêm de fixtures (`aNote`) e fakes semeados.
- [ ] Famílias de entrada usam `it.each` e os dois lados de cada limite estão cobertos.
- [ ] Caminhos de falha provam que o fake não mudou.
- [ ] ViewModel coberta em cada estado e ação; tela cobre o desenho de cada estado.
- [ ] `render`, `renderHook`, `fireEvent` e `act` com `await`.
- [ ] Não existe `it.skip` ou `it.only` sem justificativa escrita.
- [ ] `npm run verify` está verde.
