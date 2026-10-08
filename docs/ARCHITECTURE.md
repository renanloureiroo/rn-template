# Arquitetura do app

Este documento define como um app criado a partir deste template é organizado e como novas
funcionalidades devem ser construídas. Ele é prescritivo: quando código e documento divergirem, a
divergência deve ser resolvida no mesmo pull request.

O app é organizado **por feature**, e cada feature segue **MVVM**: a View desenha, a ViewModel
prepara o estado e as ações da tela, e o Model (regras e repositórios) cuida dos dados. O desenho
segue os guias oficiais de arquitetura do
[Flutter](https://docs.flutter.dev/app-architecture/guide) e do
[Android](https://developer.android.com/topic/architecture), adaptados para React: a ViewModel é
um hook, e o TanStack Query faz o papel do cache entre a ViewModel e o repositório.

Os princípios SOLID aparecem assim:

| Princípio                | Onde aparece                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Responsabilidade única   | View só desenha; ViewModel só prepara estado e ações; repositório só busca e grava; modelo só tem regras. |
| Aberto/fechado           | Uma fonte de dados nova é uma implementação nova do contrato, sem mexer em ViewModel ou View.             |
| Substituição de Liskov   | API, armazenamento local e fake cumprem o mesmo `NotesRepository`; os testes provam o comportamento.      |
| Segregação de interfaces | Cada feature declara só o que precisa (`NotesDependencies`); nada recebe o app inteiro.                   |
| Inversão de dependência  | ViewModels dependem de contratos; só `src/bootstrap` cria implementações e decide qual roda.              |

Veja também [TESTS.md](TESTS.md).

---

## 1. Stack de referência

- Expo SDK 57 (React Native 0.86, nova arquitetura, Hermes), TypeScript estrito;
- design system próprio (tokens de tema, componentes com presets) e i18n com i18next;
- [Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/) por baixo dos controles do design
  system (SwiftUI no iOS, Jetpack Compose no Android);
- TanStack Query para estado do servidor, com cache persistido no MMKV;
- Zustand para estado do cliente;
- MMKV (v4, Nitro) como armazenamento chave-valor do dispositivo;
- Gesture Handler e Reanimated para gestos e animações; `GestureHandlerRootView` envolve o app
  inteiro no `AppShell` e o plugin do Reanimated vem do `babel-preset-expo`;
- Expo Router **ou** React Navigation, escolhido na inicialização do template (seção 10);
- React Native DevTools com plugins do [Rozenite](https://www.rozenite.dev) em desenvolvimento
  (seção 12);
- Jest (`jest-expo`) e React Native Testing Library; Maestro para E2E;
- ESLint, Prettier, dependency-cruiser e npm.

Versões exatas ficam no `package.json` e no `package-lock.json`. Dependência nova precisa
resolver um problema concreto; não se adiciona infraestrutura por antecipação. Dependência
nativa nova exige development build novo (`npm run ios` / `npm run android`).

## 2. Estrutura

```text
src
├── app                       # variante Expo Router: rotas finas
├── navigation                # variante React Navigation: navigators finos
├── bootstrap                 # raiz de composição
│   ├── environment.ts        # variáveis EXPO_PUBLIC_*
│   ├── app-dependencies.ts   # cria as implementações e decide qual roda
│   ├── AppShell.tsx          # providers, fontes, i18n e o provider de cada feature
│   └── DevTools.tsx
├── features
│   └── notes
│       ├── model             # tipos e regras de negócio, TypeScript puro
│       ├── data              # contrato do repositório, implementações e queries
│       ├── stores            # estado de cliente (Zustand)
│       ├── view-models       # um hook por tela: estado pronto + ações
│       ├── views             # telas: desenham o estado da ViewModel
│       ├── i18n
│       ├── testing           # fakes e montagem da feature para testes
│       └── NotesProvider.tsx # dependências da feature + stores
└── shared                    # reutilizável, sem conhecer nenhuma feature
    ├── components            # design system
    ├── theme
    ├── i18n
    ├── errors                # AppError, mensagem por code, ErrorBoundary
    ├── http                  # HttpClient e erros HTTP
    ├── storage               # contrato KeyValueStorage e implementação MMKV
    ├── query                 # QueryClient, persistência, foco/rede
    ├── pagination
    └── utils
```

Uma feature é uma fatia do produto (notas, perfil, carrinho), não uma tela nem uma entidade. Tudo
o que só ela usa mora dentro dela: apagar a pasta apaga a feature, inclusive os testes.

Algo sobe para `shared` quando pelo menos duas features realmente precisam. Features não importam
umas às outras: quando duas precisam conversar, a combinação acontece em `bootstrap` ou na
navegação.

### Direção das dependências

```text
shared  ◄──  features  ◄──  bootstrap  ◄──  app | navigation
```

Dentro de uma feature:

```text
views ──► view-models ──► data ──► model
               │
               └──► stores
```

- a View fala só com a ViewModel: não importa repositório, queries, stores, TanStack Query nem
  Zustand;
- a ViewModel não conhece a View, a navegação nem implementações; recebe o contrato do
  repositório pelo provider da feature;
- `data` não conhece a UI;
- `model` não depende de nenhuma outra camada da feature nem de React, Expo ou bibliotecas de
  estado;
- só `src/bootstrap` cria implementações (`RemoteNotesRepository`, `LocalNotesRepository`,
  `MmkvKeyValueStorage`);
- `shared` não conhece features. A única exceção é o i18n, que reúne as traduções de cada uma.

As regras são verificadas por duas ferramentas, e violá-las quebra `npm run verify`:

- o ESLint (`.eslintrc.js`) controla **quais bibliotecas** cada camada usa;
- o dependency-cruiser (`.dependency-cruiser.js`) controla **quais pastas** cada pasta conhece,
  além de ciclos e mistura de variantes de navegação.

### Nomes de arquivo

Arquivos usam `kebab-case` (`note.ts`, `notes-repository.ts`, `remote-notes-repository.ts`,
`use-note-list-view-model.ts`, `note-draft-store.tsx`). Arquivos cujo export principal é um
componente usam `PascalCase` (`NoteListScreen.tsx`, `NotesProvider.tsx`, `Button.tsx`). Rotas do
Expo Router seguem a convenção dele (`src/app/notes/[id].tsx`). Testes ficam ao lado do arquivo
testado: `note.test.ts`, `NoteListScreen.test.tsx`.

Imports usam o alias `@/` (e `@test/` para `test/`) e apontam para o arquivo que define o
símbolo: não há barrels (`index.ts`).

## 3. Model

O modelo é dado simples e serializável, mais funções puras com as regras de negócio:

```ts
export interface Note {
  readonly id: string
  readonly title: string
  readonly createdAt: string // ISO 8601
}

export const NOTE_TITLE_MAX_LENGTH = 120

export function validateNoteTitle(title: string): string {
  if (title.trim() === "" || title.length > NOTE_TITLE_MAX_LENGTH) {
    throw new AppError(ErrorType.VALIDATION, "note.title_invalid", "...")
  }
  return title
}
```

- tipos são `interface` com campos `readonly`, sem classes: o mesmo objeto vem do repositório,
  vai para o cache persistido do TanStack Query e chega à ViewModel;
- tempo é string ISO 8601, nunca `Date`;
- regra de negócio é função pura no modelo, testada sem React. As invariantes espelham as do
  backend (`NOTE_TITLE_MAX_LENGTH = 120`), o que permite validar antes de ir à rede e usar a
  mesma constante no formulário;
- ausência é `null` explícito (`Promise<Note | null>`); `undefined` nunca sai de um repositório.

Não há camada de casos de uso. Como recomendam os guias do Flutter e do Android, ela só entra
quando aparece o caso concreto: lógica que combina vários repositórios, ou que é complexa demais
ou repetida entre ViewModels. Nesse momento, nasce como função ou classe em `model/` (ou
`domain/`, se crescer) recebendo os repositórios por parâmetro.

## 4. Dados: repositórios

O repositório é a fonte da verdade do dado da feature. Ele tem três peças:

1. **contrato** (`data/notes-repository.ts`): uma `interface` TypeScript falando em tipos do
   modelo;
2. **implementações** (`data/remote-notes-repository.ts`, `data/local-notes-repository.ts`):
   classes que fazem `implements NotesRepository`;
3. **fake** (`testing/fake-notes-repository.ts`): implementação de teste do mesmo contrato.

```ts
export interface NotesRepository {
  create(title: string): Promise<Note>
  findById(id: string): Promise<Note | null>
  list(request: PageRequest): Promise<Page<Note>>
}
```

- a implementação remota usa o `HttpClient` recebido no construtor e valida a resposta: um
  contrato quebrado no servidor falha nela, com erro inesperado, e não espalhado pela tela;
- a implementação local usa o `KeyValueStorage` recebido no construtor e aceita gerador de id e
  relógio por opção, para ser determinística em teste;
- quando um status HTTP é detalhe do protocolo, o repositório traduz: `404` em `findById` vira
  `null`;
- chaves no armazenamento são prefixadas pelo dono (`notes.items`, `query.cache`,
  `ui.themeScheme`).

Variáveis de ambiente públicas (`EXPO_PUBLIC_*`) são lidas só em `src/bootstrap/environment.ts`
e entram no bundle: segredo nunca vai para o app.

### Queries

`data/notes-queries.ts` junta chave e busca de cada query com `queryOptions` e
`infiniteQueryOptions` do TanStack Query. O repositório entra por parâmetro:

```ts
export function noteDetailQuery(repository: NotesRepository, id: string) {
  return queryOptions({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const note = await repository.findById(id)
      if (note === null) throw noteNotFound(id)
      return note
    },
  })
}
```

- chaves hierárquicas por feature (`noteKeys.all`, `lists()`, `detail(id)`);
- `retry` só para `UNAVAILABLE` (até duas vezes): erro com `code` é resposta definitiva;
- o cache é persistido no MMKV (`QueryProvider`, 24 h) e restaurado no boot. A última tela vista
  aparece offline e é revalidada em seguida;
- `QUERY_CACHE_BUSTER` em `src/shared/query/QueryProvider.tsx` muda quando o formato de um dado
  em cache muda. É o equivalente de uma migration para o cache;
- foco do app (`AppState`) e retorno da rede (`expo-network`) disparam revalidação
  (`src/shared/query/react-native-query-managers.ts`).

## 5. Injeção de dependências

Não há container. As dependências são objetos tipados, montados uma vez e entregues por React
Context:

```ts
// src/features/notes/NotesProvider.tsx: o que a feature precisa de fora, só contratos
export interface NotesDependencies {
  readonly notesRepository: NotesRepository
}

// src/bootstrap/app-dependencies.ts: o único lugar que escolhe implementações
export function createAppDependencies(
  environment: Environment = loadEnvironment(),
  storage: KeyValueStorage = new MmkvKeyValueStorage(),
): AppDependencies {
  const http = new HttpClient({ baseUrl: environment.apiUrl })
  return {
    storage,
    notes: {
      notesRepository:
        environment.notesDataSource === NotesDataSource.REMOTE
          ? new RemoteNotesRepository(http)
          : new LocalNotesRepository(storage),
    },
  }
}
```

- cada feature declara a própria interface de dependências e o próprio provider
  (`NotesProvider`), e a ViewModel lê com `useNotesDependencies()`;
- o `AppShell` monta o provider de cada feature com o pedaço correspondente de
  `AppDependencies`;
- o que é do app inteiro e não de uma feature (o `KeyValueStorage` do tema, do cache e do
  DevTools) entra por prop no provider que usa;
- nos testes, o mesmo provider recebe fakes: `createNotesTestSetup()` monta
  `<NotesProvider dependencies={{ notesRepository: fake }}>`.

A escolha de implementação acontece **só** em `src/bootstrap/app-dependencies.ts`. No exemplo,
`EXPO_PUBLIC_NOTES_DATA_SOURCE` alterna entre a API e o armazenamento local sem mudar uma linha
de ViewModel ou View.

## 6. ViewModel

A ViewModel é um hook por tela (`use<Tela>ViewModel`). Ela lê dados pelas queries, guarda o
estado da tela, aplica as regras do modelo e devolve **estado pronto para exibir** e **ações**:

```ts
export type NoteListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; notes: NoteListItem[]; hasMore: boolean; isLoadingMore: boolean }

export function useNoteListViewModel(): NoteListViewModel {
  const { notesRepository } = useNotesDependencies()
  const query = useInfiniteQuery(noteListQuery(notesRepository))
  // ...
  return { state, loadMore, refresh, retry }
}
```

- o estado é uma união discriminada por `status`: a View só escolhe o que desenhar;
- formatação para exibição (datas no idioma do usuário, mensagem de erro traduzida) acontece na
  ViewModel, não na View;
- regras do modelo rodam antes de qualquer I/O: `validateNoteTitle` vem antes de
  `notesRepository.create`;
- mutations invalidam as listas afetadas e podem semear o detalhe com o dado criado;
- a ViewModel não navega: emite eventos por callback (`onCreated(noteId)`) que a View recebeu da
  rota;
- ViewModels não chamam outras ViewModels. Lógica compartilhada vai para o modelo.

### Estado do cliente: Zustand

Dado com dono fora do app (API, armazenamento persistido) fica no TanStack Query. Zustand guarda
só estado que existe no app e precisa sobreviver a mais de um componente: o rascunho de uma nota
entre idas e vindas, preferências de visualização, um fluxo de várias etapas.

- store vanilla (`createStore`) entregue por React Context, não hook global. Cada teste e cada
  provider têm a sua instância, sem reset entre testes e sem mock do Zustand;
- só hooks com seletores atômicos são exportados (`useNoteDraftTitle`); ninguém assina a store
  inteira;
- ações agrupadas em `actions`, com referência estável e nomes de evento (`changeTitle`,
  `clear`);
- a store é lida pela ViewModel, nunca pela View; o provider dela é montado pelo provider da
  feature.

Se uma store precisar persistir no dispositivo, ela recebe o armazenamento por injeção (o
middleware `persist` com um `StateStorage` sobre `KeyValueStorage`), nunca por import direto do
MMKV.

## 7. View

A View é o componente da tela. Ela chama a ViewModel e desenha o estado:

```tsx
export function NoteListScreen({ onOpenNote, onCreateNote }: NoteListScreenProps) {
  const { state, loadMore, refresh, retry } = useNoteListViewModel()
  if (state.status === "loading") return <Loading />
  // ...
}
```

- recebe intenções de navegação como callbacks e parâmetros como props: não conhece a lib de
  navegação;
- usa só o design system (`src/shared/components`): não importa `@expo/ui`, nem `Text`,
  `TextInput`, `Button` ou `Switch` do React Native;
- subcomponentes recebem pedaços do estado e callbacks, nunca a ViewModel inteira.

### Design system

O design system é pequeno e se apoia em três ideias:

- tokens em `src/shared/theme` (`colors`, `spacing`, `typography`, `timing`), com tema claro e
  escuro e preferência persistida;
- `useAppTheme()` e `themed()` com estilos `ThemedStyle<T>`;
- componentes com `tx` (i18n), `text`, `preset` e `style`.

| Componente   | Implementação                                |
| ------------ | -------------------------------------------- |
| `Text`       | React Native, fontes e presets               |
| `Screen`     | React Native: safe area, status bar, teclado |
| `EmptyState` | React Native                                 |
| `Button`     | Expo UI (`filled`, `outlined`, `text`)       |
| `TextField`  | label/helper em RN + entrada Expo UI         |
| `Switch`     | Expo UI                                      |
| `List`       | Expo UI (`List` + `ListItem`, virtualizada)  |

Todo componente Expo UI vive dentro de um `Host`, que o wrapper monta. O tema chega ao nativo
como `colorScheme` e `seedColor`. Dentro de `List`, só entram `ListItem`: componentes React
Native não podem ser filhos de uma view SwiftUI/Compose.

Um componente novo nasce em `src/shared/components`, recebe estilos por `themed()` e expõe `tx`
quando exibe texto. Se houver equivalente no Expo UI, ele vai por baixo, dentro de um `Host`.

### i18n

Inglês e português (`src/shared/i18n`). Cada namespace de primeiro nível é usado como
`namespace:chave`. Features contribuem com o próprio namespace (`notes`) e com os erros do seu
contexto (`errors.note`), em `features/<feature>/i18n`.

## 8. Erros

Todo erro esperado do app é um `AppError` (`src/shared/errors/app-error.ts`) com `type:
ErrorType` e um `code` estável no formato `<contexto>.<motivo>`. O `code` é contrato; a mensagem
é texto técnico para log e pode evoluir.

| `ErrorType`     | Semântica                                        | Origem típica            |
| --------------- | ------------------------------------------------ | ------------------------ |
| `NOT_FOUND`     | recurso inexistente                              | modelo, HTTP 404         |
| `CONFLICT`      | estado atual impede a operação                   | HTTP 409                 |
| `VALIDATION`    | formato ou entrada inválida                      | modelo, HTTP 400         |
| `UNAUTHORIZED`  | identidade ausente ou inválida                   | HTTP 401                 |
| `FORBIDDEN`     | identidade sem permissão                         | HTTP 403                 |
| `BUSINESS_RULE` | regra de negócio violada                         | modelo, HTTP 422         |
| `UNAVAILABLE`   | a fonte não respondeu                            | rede, timeout, 502–504   |
| `UNEXPECTED`    | a fonte respondeu algo que o app não sabe tratar | HTTP 500, corpo inválido |

O `HttpClient` lê o corpo `application/problem+json` (RFC 9457) dos backends, converte o status
em `ErrorType` e **preserva o `code`** do servidor em um `HttpError` (com `status` e `traceId`).
Quando o corpo não traz `code`, usa os códigos reservados da borda do backend
(`request.invalid`, `request.not_found`, `internal.unexpected`). Sem resposta, lança `AppError`
com `network.unavailable` ou `network.timeout`. Repositórios nunca veem `Response`, status solto
ou exceção de rede crua.

A tela nunca mostra `error.message`. A ViewModel traduz com `errorMessageOf(error)`, que usa o
`code`: `note.not_found` vira a chave `errors:note.not_found` do i18n. `code` sem tradução, erro
que não é `AppError` ou valor que não é erro viram `errors:internal.unexpected`.

## 9. Fluxo ponta a ponta

```text
toque do usuário
   │
   ▼
rota (navegação) ─► View ─► ViewModel ─► regra do modelo (validação)
                              │
                              ▼
                     TanStack Query (cache persistido)
                              │
                              ▼
                     NotesRepository (contrato)
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
     RemoteNotesRepository           LocalNotesRepository
     HttpClient ─► API               KeyValueStorage ─► MMKV
               │                             │
               └──────────────┬──────────────┘
                              ▼
                 Note ─► ViewModel (estado pronto) ─► View
```

Erros sobem intactos até a ViewModel, que os traduz pelo `code`. Nenhuma camada intermediária os
converte em texto.

## 10. Navegação

A navegação é fina e **excludente**. Desde o SDK 56, o Expo Router é um fork do React Navigation
e os dois não podem ser misturados no mesmo app: o Metro recusa `@react-navigation/*` quando o
`expo-router` é resolvível. O template traz as duas variantes; a inicialização mantém uma e
remove a outra, incluindo a dependência direta.

No SDK 57 o `expo-router` chega também como dependência transitiva do `@expo/cli`, então
continua resolvível mesmo sem estar no `package.json`. Por isso a variante React Navigation
desliga essa checagem no `metro.config.js` (`EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1`), saída
indicada pela própria mensagem do Expo. A proteção perde o sentido quando o router não é usado,
e a regra `no-navigation-variant-cross` do dependency-cruiser impede que as variantes se
misturem no código.

Nas duas variantes, cada rota só traduz parâmetros e navegação em props da View, e o tema de
navegação deriva dos tokens do design system. A raiz cria as dependências
(`createAppDependencies()`) e monta o `AppShell`.

<!-- navigation:expo-router:start -->

### Expo Router

Rotas por arquivo em `src/app` (entrada `expo-router/entry`):

```text
src/app
├── _layout.tsx        # dependências, AppShell e Stack com títulos
├── index.tsx          # NoteListScreen
└── notes
    ├── new.tsx        # NoteCreateScreen
    └── [id].tsx       # NoteDetailScreen
```

```tsx
export default function NotesRoute() {
  const router = useRouter()
  return (
    <NoteListScreen
      onOpenNote={(id) => router.push({ pathname: "/notes/[id]", params: { id } })}
      onCreateNote={() => router.push("/notes/new")}
    />
  )
}
```

Recursos exclusivos do Expo Router (Native Tabs, `Stack.Toolbar`) entram nos arquivos de
`src/app`, nunca nas Views.
<!-- navigation:expo-router:end -->

<!-- navigation:react-navigation:start -->

### React Navigation

Native stack em `src/navigation` (entrada `src/navigation/index.tsx`):

```text
src/navigation
├── index.tsx           # registerRootComponent
├── App.tsx             # dependências e AppShell
├── AppNavigator.tsx    # NavigationContainer, linking e rotas
└── navigationTypes.ts  # AppStackParamList
```

```tsx
function NoteListRoute({ navigation }: AppStackScreenProps<"NoteList">) {
  return (
    <NoteListScreen
      onOpenNote={(id) => navigation.navigate("NoteDetail", { id })}
      onCreateNote={() => navigation.navigate("NoteCreate")}
    />
  )
}
```

As URLs de deep link são as mesmas da variante Expo Router (`/`, `/notes/new`, `/notes/:id`).
<!-- navigation:react-navigation:end -->

## 11. Criando uma feature

Para cada feature nova (`src/features/<feature>`):

1. `model/`: tipos e regras, precedidos por testes das regras;
2. `data/<feature>-repository.ts`: o contrato; `testing/fake-<feature>-repository.ts`: o fake;
3. `data/remote-…` e/ou `data/local-…`: implementações, precedidas por testes com `FakeFetch` ou
   `InMemoryKeyValueStorage`;
4. `data/<feature>-queries.ts`: chaves e `queryOptions`;
5. `<Feature>Provider.tsx` com a interface de dependências, e a entrada em
   `src/bootstrap/app-dependencies.ts` e no `AppShell`;
6. `view-models/`: um hook por tela, precedido por testes com `renderHook` e o fake;
7. `views/`: as telas, precedidas por testes de tela;
8. rota na variante de navegação e textos no i18n (`features/<feature>/i18n` e
   `src/shared/i18n`);
9. fluxo Maestro, quando o caminho for crítico.

Correção de bug começa por um teste que reproduz o defeito.

## 12. Performance e observabilidade

- listas usam `List` do design system (virtualização nativa) e paginação (`PageRequest`/`Page`,
  `useInfiniteQuery`);
- é proibido chamar repositório ou I/O dentro de laço de renderização;
- a ViewModel lê stores por seletores atômicos;
- formatação cara e derivações ficam na ViewModel ou em `useMemo`, não no JSX;
- erros inesperados de renderização caem no `ErrorBoundary`, o ponto único para reportar crash.

### Ferramentas de desenvolvimento

O debug usa o React Native DevTools, que vem com o React Native (`j` no terminal do
`expo start`, ou pelo menu de desenvolvimento): console, breakpoints, árvore de componentes,
profiler, rede e memória. O [Rozenite](https://www.rozenite.dev) acrescenta painéis ao mesmo
DevTools, sem app externo:

| Painel         | Plugin                              | Onde é ligado                |
| -------------- | ----------------------------------- | ---------------------------- |
| TanStack Query | `@rozenite/tanstack-query-plugin`   | `src/bootstrap/DevTools.tsx` |
| Storage (MMKV) | `@rozenite/storage-plugin`          | `src/bootstrap/DevTools.tsx` |
| Network        | `@rozenite/network-activity-plugin` | `src/bootstrap/DevTools.tsx` |

<!-- navigation:react-navigation:start -->

Na variante React Navigation, `@rozenite/react-navigation-plugin` acrescenta o painel de
navegação (estado e histórico das rotas), ligado em `src/navigation/AppNavigator.tsx`.

<!-- navigation:react-navigation:end -->

Funciona igual no fluxo gerenciado (CNG) e depois de `npx expo prebuild`, porque não há código
nativo: são hooks em JavaScript e um wrapper no `metro.config.js`. O wrapper só liga o Rozenite
no servidor de desenvolvimento. `expo export` e `expo export:embed` (o comando que o Xcode e o
Gradle executam nos builds de release) passam sem ele, e os hooks viram no-op quando
`NODE_ENV=production`. `ROZENITE=false npm start` desliga os painéis em desenvolvimento.

Plugin novo entra pelo mesmo caminho: instale o pacote e chame o hook em `DevTools.tsx`.

## 13. Convenções gerais

- identificadores, chaves de i18n e códigos de erro em inglês;
- comentários, documentação e nomes de teste em português;
- textos para o usuário sempre via i18n, em inglês e português;
- Prettier aplicado pelo ESLint (`npm run lint:fix`);
- `any` é proibido; `unknown` com estreitamento explícito quando o tipo é aberto;
- comentários explicam decisões e alternativas descartadas, não a assinatura;
- abstração nova somente quando o segundo caso concreto a exigir.

## 14. Checklist de arquitetura

- [ ] A View só fala com a ViewModel; não importa repositório, queries, stores ou TanStack.
- [ ] A ViewModel devolve estado pronto para exibir e ações; não navega nem desenha.
- [ ] Regras de negócio no modelo, em funções puras; o formulário reaproveita as constantes.
- [ ] Repositório é contrato (`interface`) com implementações e fake; só `bootstrap` escolhe.
- [ ] Dado em cache é serializável (sem `Date`, sem classe).
- [ ] Erros possuem `type` e `code`; a tradução usa o `code`.
- [ ] Dado do servidor no TanStack Query; Zustand só para estado de cliente.
- [ ] Features não importam umas às outras; `shared` não conhece features.
- [ ] Textos novos em inglês e português.
- [ ] `npm run verify` está verde.

## 15. Decisões ainda abertas

Não devem ser inventadas antes do primeiro caso concreto:

- features além do exemplo;
- camada de casos de uso (seção 3);
- autenticação, guarda de token (`expo-secure-store`) e renovação de sessão;
- mutations offline com fila de sincronização (outbox no dispositivo);
- crash reporting e analytics;
- push notifications;
- feature flags;
- atualizações OTA (EAS Update) e estratégia de builds/lojas.

Quando uma decisão dessas for tomada, ela deve atualizar este documento e, se tiver
alternativas relevantes ou custo duradouro, ganhar um ADR em [`docs/adr`](adr/README.md).
