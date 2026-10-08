// https://docs.expo.dev/guides/using-eslint/

// Bibliotecas que cada camada da feature pode usar. Quais pastas cada pasta conhece fica no
// .dependency-cruiser.js; aqui fica só o que é import de pacote.
const NAVIGATION = {
  group: ["expo-router", "expo-router/*", "@react-navigation/*"],
  message: "Telas e ViewModels não conhecem a navegação: recebem e emitem callbacks.",
}
const EXPO_UI = {
  group: ["@expo/ui", "@expo/ui/*"],
  message: "Use os componentes de @/shared/components (design system).",
}
const DEVICE = {
  group: ["react-native-mmkv", "expo-crypto", "expo-network"],
  message: "Acesso a dispositivo mora no repositório ou em @/shared/storage.",
}

const LAYER_IMPORTS = {
  // Modelo: TypeScript puro, testável sem React.
  model: [
    { group: ["react", "react-*", "react/*"], message: "O modelo não conhece React." },
    { group: ["expo", "expo-*", "@expo/*"], message: "O modelo não conhece o Expo." },
    { group: ["@tanstack/*", "zustand", "zustand/*"], message: "Estado mora na ViewModel." },
    {
      group: ["i18next", "react-i18next", "date-fns", "date-fns/*"],
      message: "Apresentação mora na ViewModel.",
    },
    NAVIGATION,
  ],
  // Dados: repositórios e queries. Sem UI e sem estado de tela.
  data: [
    {
      group: ["react", "react/*", "react-native", "react-i18next"],
      message: "Repositórios não conhecem a UI.",
    },
    {
      group: ["zustand", "zustand/*", "i18next"],
      message: "Estado de cliente e textos moram na ViewModel.",
    },
    NAVIGATION,
    EXPO_UI,
  ],
  // ViewModel: estado e ações da tela. Não desenha nada nem fala com o dispositivo direto.
  viewModels: [
    { group: ["react-native"], message: "A ViewModel não desenha: componentes moram na View." },
    NAVIGATION,
    EXPO_UI,
    DEVICE,
  ],
  // View: desenha o estado da ViewModel. Dado remoto e estado de cliente chegam por ela.
  views: [
    {
      group: ["@tanstack/*", "zustand", "zustand/*"],
      message: "A View lê estado só da ViewModel.",
    },
    NAVIGATION,
    EXPO_UI,
    DEVICE,
  ],
}

// Restrições que valem em todo o código; overrides por camada somam padrões a elas.
const BASE_RESTRICTED_PATHS = [
  {
    name: "react",
    importNames: ["default"],
    message: "Import named exports from 'react' instead.",
  },
  {
    name: "react-native",
    importNames: ["SafeAreaView"],
    message: "Use the SafeAreaView from 'react-native-safe-area-context' instead.",
  },
  {
    name: "react-native",
    importNames: ["Text", "Button", "TextInput", "Switch"],
    message: "Use the design system components from '@/shared/components'.",
  },
]

module.exports = {
  root: true,
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-native/all",
    // `expo` must come after `standard` or its globals configuration will be overridden
    "expo",
    // `jsx-runtime` must come after `expo` or it will be overridden
    "plugin:react/jsx-runtime",
    "prettier",
  ],
  plugins: ["prettier"],
  ignorePatterns: ["node_modules/", "coverage/", "dist/", ".expo/", "android/", "ios/"],
  rules: {
    "prettier/prettier": "error",
    // typescript-eslint
    "@typescript-eslint/array-type": 0,
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-require-imports": 0,
    "@typescript-eslint/no-empty-object-type": 0,
    // `const X = {...} as const` + `type X` com o mesmo nome é o padrão do projeto (ErrorType).
    "@typescript-eslint/no-redeclare": 0,
    // eslint
    "no-use-before-define": 0,
    "no-restricted-imports": [
      "error",
      {
        paths: BASE_RESTRICTED_PATHS,
      },
    ],
    // react
    "react/prop-types": 0,
    // react-native
    "react-native/no-raw-text": 0,
    "react-native/no-inline-styles": 0,
    "react-native/no-color-literals": 0,
    "react-native/sort-styles": 0,
    // eslint-config-standard overrides
    "comma-dangle": 0,
    "no-global-assign": 0,
    "quotes": 0,
    "space-before-function-paren": 0,
    // eslint-import
    "import/order": [
      "error",
      {
        "alphabetize": {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
        "groups": [["builtin", "external"], "internal", "unknown", ["parent", "sibling"], "index"],
        "distinctGroup": false,
        "pathGroups": [
          { pattern: "react", group: "external", position: "before" },
          { pattern: "react-native", group: "external", position: "before" },
          { pattern: "expo{,-*}", group: "external", position: "before" },
          { pattern: "@/**", group: "unknown", position: "after" },
          { pattern: "@test/**", group: "unknown", position: "after" },
        ],
        "pathGroupsExcludedImportTypes": ["react", "react-native", "expo", "expo-*"],
      },
    ],
    "import/newline-after-import": 1,
    // Sem barrels: cada import aponta para o arquivo que define o símbolo.
    "import/no-useless-path-segments": "error",
  },
  overrides: [
    ...Object.entries({
      model: "src/features/*/model/**",
      data: "src/features/*/data/**",
      viewModels: "src/features/*/view-models/**",
      views: "src/features/*/views/**",
    }).map(([layer, files]) => ({
      files: [files],
      excludedFiles: ["*.test.ts", "*.test.tsx"],
      rules: {
        "no-restricted-imports": [
          "error",
          { paths: BASE_RESTRICTED_PATHS, patterns: LAYER_IMPORTS[layer] },
        ],
      },
    })),
    {
      // O código compartilhado não conhece a lib de navegação: cada variante monta a sua.
      files: ["src/shared/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: BASE_RESTRICTED_PATHS,
            patterns: [
              {
                group: ["expo-router", "expo-router/*", "@react-navigation/*"],
                message: "O código compartilhado não conhece a navegação.",
              },
              {
                group: ["@/app/*", "@/navigation/*"],
                message: "A navegação depende da UI, não o contrário.",
              },
            ],
          },
        ],
      },
    },
    {
      // Os wrappers do design system e o fake de teste do Expo UI usam as primitivas.
      files: ["src/shared/components/**", "test/support/expo-ui-fake.tsx"],
      rules: { "no-restricted-imports": "off" },
    },
    {
      files: ["test/**", "**/*.test.ts", "**/*.test.tsx", "src/features/*/testing/**"],
      env: { jest: true },
    },
  ],
}
