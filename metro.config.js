/* eslint-env node */
// https://docs.expo.dev/guides/customizing-metro
const { withRozenite } = require("@rozenite/metro")
const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    // Adia o carregamento de módulos até o primeiro uso.
    // https://reactnative.dev/docs/optimizing-javascript-loading
    inlineRequires: true,
  },
})

// Algumas bibliotecas publicam módulos com extensão .cjs.
config.resolver.sourceExts.push("cjs")

// Rozenite (plugins do React Native DevTools) só no servidor de desenvolvimento. Empacotar o
// bundle não passa por ele: `expo export` (bundle:check, EAS Update) e `expo export:embed`, que é
// o comando que o Xcode e o Gradle executam nos builds de release depois do prebuild.
// ROZENITE=false desliga também em desenvolvimento.
const BUNDLING_COMMANDS = ["export", "export:embed", "bundle"]
const isBundling = BUNDLING_COMMANDS.includes(process.argv[2] ?? "")

module.exports = withRozenite(config, {
  enabled: !isBundling && process.env.ROZENITE !== "false",
})
