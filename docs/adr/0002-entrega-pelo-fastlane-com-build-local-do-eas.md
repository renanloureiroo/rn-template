# 0002. Entrega pelo fastlane com build local do EAS

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Gerar o binário, escolher o número do build, assinar e enviar para testadores e lojas tem passos
fáceis de esquecer. O build na nuvem do EAS exige mandar os `.env` e as credenciais para fora da
máquina e tem fila e cota.

## Decisão

Cada destino tem um comando (`npm run release:<ios|android>:<dev|prod>`), que roda um lane do
fastlane:

1. escolhe o número do build pelo destino (último do Firebase App Distribution, do TestFlight ou
   das faixas do Google Play, mais 1);
2. gera o binário com `eas build --local` no perfil do ambiente;
3. assina o iOS com o `match` e entrega: a Dev ao Firebase App Distribution, a produção ao
   TestFlight e ao Google Play.

Os segredos ficam em `fastlane/.env`, fora do git e do build. O passo a passo está em
[BUILDS.md](../BUILDS.md).

## Alternativas consideradas

- **fastlane com build local do EAS (escolhida):** o build é o mesmo do EAS, mas roda na máquina e
  não manda segredo para fora.
- **EAS Build e EAS Submit na nuvem:** sem máquina com Xcode, mas com os `.env` e as credenciais
  nos servidores da Expo.
- **Xcode e Gradle à mão:** passos manuais que se perdem.

## Consequências

- O build do iOS precisa de um Mac com Xcode.
- O Firebase entra só na distribuição da Dev; o app não precisa do SDK dele.
