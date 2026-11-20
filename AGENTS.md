# AGENTS.md

App Expo SDK 58 (React Native 0.88, development build, não roda no Expo Go) organizado por feature
com MVVM, design system próprio sobre Expo UI, TanStack Query (cache persistido no MMKV), Zustand,
Jest e Maestro. Imports usam o alias `@/` e apontam para o arquivo que define o símbolo, sem
barrels.

Ordem de autoridade: [constituição](.specify/memory/constitution.md) ► documentos de `docs/` ►
este arquivo. Antes de alterar código, leia [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`docs/TESTS.md`](docs/TESTS.md) e os [ADRs](docs/adr/README.md). Formulário,
[`docs/FORMS.md`](docs/FORMS.md); build e entrega, [`docs/BUILDS.md`](docs/BUILDS.md).

## Comandos

| Para                                      | Comando                                           |
| ----------------------------------------- | ------------------------------------------------- |
| Portão de entrega (o mesmo do CI)         | `npm run verify`                                  |
| Um arquivo, uma pasta ou um caso de teste | `npx jest <caminho>` / `npx jest -t "<nome>"`     |
| Lint com correção e Prettier              | `npm run lint:fix`                                |
| Tipos / regras de camada                  | `npm run typecheck` / `npm run lint:architecture` |
| Instalar o development build e abrir      | `npm run ios` / `npm run android`                 |
| Só o Metro (build já instalado)           | `npm start`                                       |
| Regerar `ios/` e `android/`               | `npm run prebuild:clean`                          |
| E2E (Metro rodando, build instalado)      | `npm run test:e2e`                                |
| Entregar aos testadores ou às lojas       | `npm run release:<ios\|android>:<dev\|prod>`      |

- `npm run verify` roda ESLint, dependency-cruiser de arquitetura, typecheck, Jest e o bundle de
  iOS e Android. Nenhum teste é pulado para ele passar.
- Mudou dependência nativa, plugin ou `app.config.ts`: `npm run ios`/`android` de novo; `npm start`
  não basta. Mudou `.env.local`: reinicie o Metro.
- `APP_ENV=development` (padrão, `.env.local`, versão Dev) ou `production` (`.env`).

## Arquitetura

A dependência aponta em uma única direção: `shared` ◄ `features` ◄ `bootstrap` ◄ navegação.
Dentro de uma feature: `views` ► `view-models` ► `data` ► `model`.

- a View só fala com a ViewModel (um hook por tela), que devolve estado pronto para exibir e
  ações;
- regras de negócio ficam no modelo, em funções puras e schemas do zod (mensagem = `code` do
  erro); dado em cache é serializável (tempo em ISO 8601);
- repositório é um contrato (`interface`) com implementações e um fake; só `src/bootstrap`
  cria implementações e escolhe qual roda;
- a ViewModel recebe dependências pelo provider da feature, nunca importando implementações;
- a tela traduz erros pelo `code`, nunca pela mensagem;
- dado do servidor no TanStack Query; Zustand só para estado de cliente;
- formulário: `useSchemaForm` na ViewModel e `useFormField` por campo na View, sem importar as
  bibliotecas por trás;
- escrita otimista por padrão; formulário, dado criado pelo serviço e ação sem volta esperam a
  resposta;
- resultado de ação vira aviso pela fila (`useSnackbar`); feedback tátil pelo evento
  (`haptics().play`);
- telas não conhecem navegação (recebem callbacks) nem `@expo/ui` (usam `src/shared/components`);
- toda tela funciona em pé e deitado, telefone e tablet e fonte grande: o layout muda pela classe
  de largura do contêiner (`useWidthClass`), nunca trava a orientação;
- features não importam umas às outras; `shared` não conhece features;
- textos para o usuário em inglês e português, via i18n;
- código nativo nasce de config plugin em `plugins/`, com teste;
- feature nova passa pelo Spec Kit (`/speckit-specify` ► `plan` ► `tasks` ► `implement`), com os
  artefatos em `specs/NNN-<nome>/`;
- decisão com alternativas relevantes ou custo duradouro ganha um ADR em `docs/adr`.

## Testes

- Teste antes do código, na ordem de `docs/TESTS.md`; bug começa por um teste vermelho.
- `*.test.ts(x)` ao lado do código. Fakes de contrato na feature (`testing/`); fakes de
  biblioteca de terceiro em `test/support`.
- Mock sobre contrato do projeto é proibido (`jest.fn`, `jest.mock`, `jest.spyOn` sobre
  repositório, `HttpClient`, `KeyValueStorage`, ViewModel ou store).
- Erro é afirmado por classe, `type` e `code`; texto só onde o usuário o vê.

## Aparelho físico primeiro

Rodar o app, conferir uma mudança na tela e o E2E vão para o aparelho físico conectado, por cabo
ou Wi-Fi. Simulador e emulador só entram quando não há aparelho, ou para o que o aparelho não
cobre (tablet, outro tamanho de tela, outra versão do sistema).

- Antes de ligar simulador ou emulador, veja o que está conectado: `adb devices -l` (Android) e
  `xcrun devicectl list devices` (iOS). Aparelho `unauthorized`: peça para aceitar a depuração na
  tela dele.
- Metro no Android: `npm run adb` (`adb reverse` de 8081 e da API), por cabo ou Wi-Fi. Refaça
  quando o aparelho reconectar.
- Com mais de um aparelho, escolha o alvo: `npm run android -- --device "<nome>"`,
  `npm run ios -- --device "<nome>"`, `maestro --device <serial> test …` e `adb -s <serial>`.
- O aparelho é pessoal: limpar dados, desinstalar ou mudar ajustes só no app Dev
  (`<applicationId>.dev`), nunca no de produção nem em outro app. Não reinicie o aparelho nem mexa
  em ajustes do sistema sem pedir.

## Ao terminar uma tarefa

Deixe o ambiente como encontrou, apagando só o que a tarefa criou e só deste projeto:

```sh
pkill -f "$PWD/node_modules/"
adb reverse --remove-all
xcrun simctl shutdown <udid do simulador que a tarefa ligou>
adb -s <serial do emulador que a tarefa ligou> emu kill
rm -rf .expo/bundle-check coverage dist dependency-graph.svg .maestro/recordings
```

Worktrees e branches: só os deste repositório (`git worktree list`), criados pela tarefa e já
integrados.

## Quando o build nativo quebra ou o disco aperta

Caches que o próximo build recria do zero (e demora): não limpe por hábito.

```sh
rm -rf ios/Pods ios/build
(cd android && ./gradlew clean)
watchman watch-del "$PWD"
npm run prebuild:clean
npx expo start --dev-client --clear
```
