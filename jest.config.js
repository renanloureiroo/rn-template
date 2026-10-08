// Toda a suíte roda em UTC: datas formatadas e instantes são determinísticos.
process.env.TZ = "UTC"

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  roots: ["<rootDir>/src", "<rootDir>/test"],
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
