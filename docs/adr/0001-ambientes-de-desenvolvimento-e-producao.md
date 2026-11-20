# 0001. Ambientes de desenvolvimento e produção

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro

## Contexto

Quem desenvolve e quem testa precisa do app de produção e da versão em teste no mesmo aparelho, sem
uma apagar os dados da outra, e sem risco de uma versão de teste falar com o servidor de produção.

## Decisão

`APP_ENV` (`development`, padrão, ou `production`) escolhe tudo o que muda no build, numa tabela só
(`config/app-environments.ts`): nome (`<App> Dev`), identificador (`.dev` no fim), esquema de
link, ícone e o arquivo com as `EXPO_PUBLIC_*` (`.env.local` na Dev, `.env` na produção). O
`app.config.ts` lê a tabela; o `app.json` não guarda nada que varie. Em produção, a falta do
arquivo para o build; na Dev, é tolerada. `APP_BUILD_NUMBER` fixa o número do build.

A Dev é também a versão de teste: o perfil `preview` do EAS é a Dev em release.

## Alternativas consideradas

- **Tabela de ambientes no `app.config.ts` (escolhida):** um lugar só, testado, e o mesmo
  identificador no iOS e no Android.
- **Variantes nativas (flavors e schemes) à mão:** desfazem-se a cada prebuild.
- **Três ambientes (dev, staging, prod):** mais custo do que um projeto pequeno precisa; um terceiro
  entra na tabela quando houver motivo.

## Consequências

- Serviços externos que conhecem o identificador (lojas, login social, push) precisam de um app
  por ambiente.
- Trocar de ambiente exige um build novo; o Metro sozinho não muda o identificador.
