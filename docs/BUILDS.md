# Builds e distribuição

Este documento explica como gerar os binários do app e entregá-los aos testadores e às lojas. Os
ambientes (`development` e `production`) e o motivo de cada `.env` estão no
[ADR 0001](adr/0001-ambientes-de-desenvolvimento-e-producao.md).

---

## 1. Jeitos de rodar o app

| Jeito             | Comando                                           | Para quê                                                     |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| Development build | `npm run ios` / `npm run android`                 | Dia a dia: compila no Xcode/Gradle e usa o Metro             |
| Release local     | `npm run ios:release` / `npm run android:release` | Ver a Dev sem o Metro, direto no simulador ou aparelho       |
| Entrega           | `npm run release:<plataforma>:<dev\|prod>`        | Gerar o binário pelo EAS e entregar aos testadores ou à loja |

Os builds do EAS rodam **na máquina** (`--local`), nunca na nuvem: os `.env` entram no build pelo
`.easignore` e não podem ir para os servidores da Expo.

## 2. Perfis do `eas.json`

| Perfil       | `APP_ENV`     | Android                           | iOS                          | Usado por        |
| ------------ | ------------- | --------------------------------- | ---------------------------- | ---------------- |
| `preview`    | `development` | APK release, sem credenciais      | Aparelho, Release, ad hoc    | `release:*:dev`  |
| `production` | `production`  | AAB assinado com o keystore local | Aparelho, Release, App Store | `release:*:prod` |

- A Dev é também a versão de teste: o `preview` é a Dev em release, e é ele que vai para os
  testadores.
- O `eas-cli` não é dependência do projeto: o script `eas` roda `npx --yes eas-cli@24.13.0`, a
  versão exigida em `cli.version` do `eas.json`. Para outro comando do EAS, use
  `npm run eas -- <comando>`.

## 3. O que o build precisa

| Item                | Onde                                                  | Quem precisa                                       |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `.env.local`        | raiz, fora do git (`.env.example`)                    | `preview`                                          |
| `.env`              | raiz, fora do git (`.env.example`)                    | `production`                                       |
| `credentials.json`  | raiz, fora do git                                     | `production` no Android; no iOS, escrito pelo lane |
| Keystore de release | fora do repositório, apontado pelo `credentials.json` | `production` no Android                            |
| Conta Apple         | —                                                     | todo build do iOS                                  |

- Sem o `.env` do ambiente, o build para cedo com `Arquivo .env ausente para APP_ENV=...`, e o
  lane da entrega para antes do build quando falta o arquivo do ambiente.
- Na primeira vez, ligue o projeto ao EAS com `npm run eas -- init`, que grava o
  `extra.eas.projectId` no `app.json`.
- A versão vem do `version` do `app.json` (`appVersionSource: local`,
  [como subir](#6-versão-do-app)); o número do build, do lane.

## 4. Entrega

Cada destino tem um comando. Ele escolhe o número do build, gera o binário pelo
`eas build --local` e entrega ([ADR 0002](adr/0002-entrega-pelo-fastlane-com-build-local-do-eas.md)):

| Comando                        | App        | Perfil       | Destino                                    |
| ------------------------------ | ---------- | ------------ | ------------------------------------------ |
| `npm run release:ios:dev`      | Versão Dev | `preview`    | Firebase App Distribution, grupo `testers` |
| `npm run release:android:dev`  | Versão Dev | `preview`    | Firebase App Distribution, grupo `testers` |
| `npm run release:ios:prod`     | Produção   | `production` | TestFlight                                 |
| `npm run release:android:prod` | Produção   | `production` | Google Play, faixa `internal` (padrão)     |

Opções vão depois de `--`, no formato do fastlane:

```bash
npm run release:android:dev -- notes:"o que mudou"
npm run release:ios:dev -- notes:"o que mudou"
npm run release:android:prod -- track:alpha          # teste fechado
npm run release:android:prod -- status:completed     # depois que o app for publicado
npm run release:android:prod -- upload:false version_code:1   # só gera o AAB
```

- **Número do build:** o último do destino mais 1 (último release do Firebase, último build do
  TestFlight ou maior `versionCode` das faixas do Play). Ele entra em `APP_BUILD_NUMBER`, e o
  `app.config.ts` o grava no `buildNumber` e no `versionCode`. A versão vem do `app.json`.
- **Notas no Firebase:** `<versão> (<commit curto>): <notas>`. Faça o commit antes, ou as notas
  apontam para o commit anterior.
- **Assinatura do iOS:** o lane busca no `match` o certificado e o perfil do destino, exporta para
  `fastlane/signing/` e reescreve a parte `ios` do `credentials.json`. O `.p12` ganha uma senha
  aleatória a cada entrega.
- **Aparelhos da Dev no iOS:** o testador aceita o convite do Firebase no iPhone e registra o
  aparelho. O próximo `release:ios:dev` registra o UDID na Apple, o `match` refaz o perfil ad
  hoc, e o build sai instalável no aparelho novo. Builds anteriores não instalam nele.
- Os binários ficam em `fastlane/builds/`, fora do git e do próximo build.

## 5. Primeira configuração da entrega

Uma vez por máquina:

1. Ruby do projeto e gems: `rbenv install 3.3.8` (o `.ruby-version` escolhe a versão) e
   `bundle install`. O `Gemfile` fixa o fastlane, o plugin do Firebase e o CocoaPods.
2. `npx firebase login`, com a conta que tem acesso ao projeto do Firebase usado na distribuição
   da Dev. Só a distribuição usa o Firebase; o app não precisa do SDK dele.
3. Copie `fastlane/.env.example` para `fastlane/.env` e preencha. Os caminhos são relativos à
   raiz do projeto; deixe os arquivos de chave fora dele.

| Variável                  | O que é                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `ASC_KEY_ID`              | Key ID da chave de API da App Store Connect (papel Admin)               |
| `ASC_ISSUER_ID`           | Issuer ID da mesma tela                                                 |
| `ASC_KEY_PATH`            | Caminho do `.p8` da chave                                               |
| `MATCH_GIT_URL`           | Repositório git privado do `match`                                      |
| `MATCH_PASSWORD`          | Senha que criptografa o repositório do `match`                          |
| `PLAY_JSON_KEY_PATH`      | Chave JSON da conta de serviço com acesso ao app no Google Play Console |
| `FIREBASE_APP_ID_IOS`     | Id do app iOS da Dev no Firebase App Distribution                       |
| `FIREBASE_APP_ID_ANDROID` | Id do app Android da Dev no Firebase App Distribution                   |
| `FIREBASE_TESTER_GROUPS`  | Grupos que recebem a Dev (padrão `testers`)                             |

Uma vez por conta:

- **`match`:** o certificado de distribuição atual entra no repositório com
  `bundle exec fastlane match import --type appstore` (o `.cer` baixado do portal e o `.p12`
  exportado do Keychain, sem senha). Sem o import, o primeiro `match` cria outro certificado. Os
  perfis (ad hoc da Dev, App Store da produção) nascem no primeiro `release:ios:*`.
- **Google Play:** o app (identificador de produção, em `config/app-environments.ts`) criado no Play Console e o primeiro AAB
  enviado pelo console (`release:android:prod -- upload:false version_code:1` gera o arquivo). A
  partir do segundo, o lane envia. Enquanto o app não for publicado, o Play só aceita release
  `draft` pela API: o lane envia em rascunho, e a liberação na faixa é feita no console. Depois da
  publicação, use `status:completed`.
- **TestFlight:** o `app.json` declara que o app não usa criptografia além da isenta
  (`usesNonExemptEncryption: false`, só HTTPS), e o build chega aos testadores internos sem a
  pergunta de conformidade de exportação.

## 6. Versão do app

Um comando sobe a versão no `package.json`, no `package-lock.json` e no `app.json` de uma vez:

| Comando                 | De `1.2.3` para | Quando                       |
| ----------------------- | --------------- | ---------------------------- |
| `npm run version:patch` | `1.2.4`         | Correção, como um hotfix     |
| `npm run version:minor` | `1.3.0`         | Funcionalidade nova          |
| `npm run version:major` | `2.0.0`         | Mudança grande para quem usa |

- O comando só altera os arquivos: o commit e a tag ficam com quem está entregando. Faça o commit
  antes da entrega, ou as notas no Firebase apontam para o commit anterior.
- Por trás, é o `npm version --no-git-tag-version`, e o script `version` copia a versão para o
  `app.json`. Sem `--no-git-tag-version`, o `npm version` faz um commit que deixa o `app.json` de
  fora.
- O número do build não muda aqui: ele sai do lane, na entrega.
