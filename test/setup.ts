import { initI18n } from "@/shared/i18n"
import { loadDateFnsLocale } from "@/shared/utils/formatDate"

// Fronteira de terceiro: o idioma do dispositivo vem do expo-localization. A suíte roda em
// pt-BR com as traduções reais, então asserções sobre texto provam o que o usuário vê.
jest.mock("expo-localization", () => ({
  ...jest.requireActual("expo-localization"),
  getLocales: () => [{ languageTag: "pt-BR", textDirection: "ltr" }],
}))

// O MMKV v4 usa a própria instância em memória sob Jest (createMockMMKV), mas importa o Nitro no
// topo do módulo. O stub só satisfaz essa importação; nada do Nitro é chamado nos testes.
jest.mock("react-native-nitro-modules", () => ({ NitroModules: {} }))

// Mock oficial distribuído pela própria biblioteca de teclado.
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
)

beforeAll(async () => {
  await initI18n()
  loadDateFnsLocale()
})
