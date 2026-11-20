// Toda a suíte roda em UTC: datas formatadas e instantes são determinísticos.
process.env.TZ = "UTC"

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Num caminho fixo, para o CI guardar as transformações entre as execuções.
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  // `config/` tem a tabela de ambientes, `scripts/` os scripts de Node e `plugins/` os config
  // plugins do prebuild, todos testados ao lado do código como o resto.
  roots: ["<rootDir>"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/ios/",
    "/android/",
    "/.expo/",
    "/dist/",
    "/.claude/",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/ios/",
    "<rootDir>/android/",
    "<rootDir>/.expo/",
    "<rootDir>/dist/",
    "<rootDir>/.claude/",
  ],
  // Setup oficial do Gesture Handler para Jest (mocks dos módulos nativos dele).
  setupFiles: ["react-native-gesture-handler/jestSetup"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    // Fake da fronteira de terceiro: ver test/support/expo-ui-fake.tsx.
    "^@expo/ui$": "<rootDir>/test/support/expo-ui-fake.tsx",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
  },
}
