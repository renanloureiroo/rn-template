# RN Template

Template de app mobile com Expo SDK 57 (React Native 0.86), organizado por feature com MVVM,
design system próprio sobre Expo UI, TanStack Query com cache persistido no MMKV, Zustand, Jest e
Maestro.

<!-- template:start -->

A arquitetura segue os guias oficiais do Flutter e do Android (View, ViewModel e repositórios),
adaptados para React, com SOLID aplicado sem cerimônia: cada repositório é um contrato com
implementações (API, dispositivo) e um fake para testes, e só a raiz de composição decide qual
roda. A API consumida é a dos backends
[nestjs-hexagonal-template](https://github.com/renanloureiroo/nestjs-hexagonal-template) e
[spring-boot-hexagonal-template](https://github.com/renanloureiroo/spring-boot-hexagonal-template),
com os mesmos códigos de erro (lidos do RFC 9457 que eles publicam).

<!-- template:end -->

A feature `notes` mostra o caminho completo: View → ViewModel → TanStack Query → repositório
(API ou armazenamento local). Ela deve ser removida ou renomeada quando a primeira feature real
for criada.

## Requisitos

- Node.js 24 (`nvm use`);
- Xcode (iOS) e/ou Android Studio (Android);
- [Maestro](https://maestro.mobile.dev), opcional, para os testes E2E.

O app usa módulos nativos (MMKV v4, keyboard controller, Expo UI), então roda em um
[development build](https://docs.expo.dev/develop/development-builds/introduction/), não no Expo
Go.

## Rodando localmente

```bash
cp .env.example .env
npm install
npm run ios        # ou npm run android
```

O primeiro `npm run ios` / `npm run android` gera o projeto nativo e instala o development
build. Depois disso, `npm start` basta enquanto nenhuma dependência nativa mudar.

### Fonte de dados do exemplo

Por padrão, as notas ficam no dispositivo (MMKV) e o app funciona sem backend. Para usar a API
dos templates de backend:

```bash
EXPO_PUBLIC_NOTES_DATA_SOURCE=remote
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

A troca acontece só em `src/bootstrap/app-dependencies.ts`: modelo, ViewModels e Views não
mudam. No emulador Android, rode `npm run adb` para que `localhost` alcance a
máquina.

> Os templates de backend publicam `POST /api/notes` e `GET /api/notes/{id}`. A listagem usa
> `GET /api/notes?page=0&size=20`, que devolve `{ items, total }` no formato de `Page`; esse
> endpoint precisa existir no backend para a lista funcionar no modo `http`.

## Debug

`j` no terminal do `npm start` abre o React Native DevTools, com painéis do
[Rozenite](https://www.rozenite.dev) para o cache do TanStack Query, o conteúdo do MMKV e as
requisições de rede. Os painéis só existem em desenvolvimento; veja
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#ferramentas-de-desenvolvimento).

## Testes

```bash
npm test
npm run verify
npm run test:e2e
```

`npm run verify` é o portão de entrega: lint, regras de arquitetura (ESLint e
dependency-cruiser), typecheck, testes e bundle de iOS e Android. Os testes E2E exigem o
development build instalado no simulador. Veja [docs/TESTS.md](docs/TESTS.md).

## Navegação

<!-- template:start -->

O template traz as duas variantes de navegação e funciona com Expo Router até ser inicializado.
A inicialização mantém uma e remove a outra, inclusive a dependência: desde o SDK 56 as duas
não podem ser misturadas no mesmo app. As telas são as mesmas nas duas, porque não conhecem a
navegação.

<!-- template:end -->

<!-- navigation:expo-router:start -->

Expo Router, com rotas por arquivo em `src/app`. Cada rota só liga parâmetros e navegação às
telas de `src/features/*/views`.
<!-- navigation:expo-router:end -->

<!-- navigation:react-navigation:start -->

React Navigation (native stack) em `src/navigation`. Cada rota só liga parâmetros e navegação
às telas de `src/features/*/views`.
<!-- navigation:react-navigation:end -->

<!-- template:start -->

## Usando como template

Clique em **Use this template** e dê ao repositório o nome do projeto, por exemplo `orders-app`.
Depois, em **Actions → Template init → Run workflow**, escolha a navegação. O workflow renomeia
tudo a partir do nome do repositório e commita o resultado:

| Item                        | Exemplo para `orders-app` |
| --------------------------- | ------------------------- |
| `name` do `package.json`    | `orders-app`              |
| Nome do app (`app.json`)    | `OrdersApp`               |
| Scheme de deep link         | `ordersapp`               |
| Bundle id / package Android | `com.ordersapp`           |
| Navegação                   | a escolhida no workflow   |

Para inicializar localmente, depois de clonar:

```bash
scripts/init-template.sh orders-app                               # Expo Router
scripts/init-template.sh orders-app --navigation=react-navigation # React Navigation
npm ci
npm run verify
```

Depois da inicialização:

1. ajuste `description` no `package.json` e troque ícones e splash em `assets/images`;
2. remova ou renomeie `src/features/notes`, suas rotas, sua entrada em
   `src/bootstrap/app-dependencies.ts` e no `AppShell`, e suas chaves de i18n;
3. substitua este README pela apresentação do produto;
4. revise as decisões abertas em `docs/ARCHITECTURE.md`.

<!-- template:end -->

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Testes](docs/TESTS.md)
