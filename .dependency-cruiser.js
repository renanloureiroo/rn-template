// Mesmas extensões que o Metro resolve, com as variantes por plataforma (.ios.tsx, .native.ts...).
const platforms = ["ios", "android", "web", "native"]
const extensions = ["ts", "tsx", "js", "jsx", "json", "cjs"].flatMap((ext) =>
  platforms.map((platform) => `.${platform}.${ext}`).concat(`.${ext}`),
)

// Testes e utilitários de teste podem montar qualquer peça com fakes; as regras de camada valem
// para o código que vai para o app.
const TEST_CODE = "(\\.test\\.tsx?$|/testing/)"

// Quais pastas cada pasta conhece. Quais bibliotecas cada camada usa fica no .eslintrc.js.
//
//   shared  ◄──  features  ◄──  bootstrap  ◄──  app | navigation
//
// Dentro de uma feature:  views ─► view-models ─► data ─► model
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature",
      severity: "error",
      comment:
        "Features não importam umas às outras. O que duas features precisam sobe para shared; " +
        "a combinação entre features acontece no bootstrap ou na navegação.",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/([^/]+)/", pathNot: "^src/features/$1/" },
    },
    {
      name: "shared-knows-no-feature",
      severity: "error",
      comment:
        "shared é reutilizável e não conhece features, composição ou navegação. Única exceção: " +
        "o i18n de shared reúne as traduções de cada feature.",
      from: { path: "^src/shared/" },
      to: {
        path: "^src/(features|bootstrap|app|navigation)/",
        pathNot: "^src/features/[^/]+/i18n/",
      },
    },
    {
      name: "feature-knows-no-composition",
      severity: "error",
      comment:
        "Features não conhecem a raiz de composição nem a navegação: recebem dependências pelo " +
        "provider e intenções de navegação por callback.",
      from: { path: "^src/features/" },
      to: { path: "^src/(bootstrap|app|navigation)/" },
    },
    {
      name: "implementations-only-in-bootstrap",
      severity: "error",
      comment:
        "Só a raiz de composição (src/bootstrap) cria implementações. O resto do app conhece os " +
        "contratos (NotesRepository, KeyValueStorage), e é isso que deixa trocar por fakes.",
      from: { path: "^src/", pathNot: `^src/bootstrap/|${TEST_CODE}` },
      to: { path: "^src/(features/[^/]+/data/(remote|local)-|shared/storage/mmkv-)" },
    },
    {
      name: "view-talks-to-view-model",
      severity: "error",
      comment:
        "A View só desenha o estado da ViewModel e chama as ações dela. Repositório, queries e " +
        "stores chegam pela ViewModel.",
      from: { path: "^src/features/[^/]+/views/", pathNot: TEST_CODE },
      to: { path: "^src/features/[^/]+/(data|stores)/" },
    },
    {
      name: "view-model-knows-no-view",
      severity: "error",
      comment: "A ViewModel não conhece a View: devolve estado e ações.",
      from: { path: "^src/features/[^/]+/view-models/" },
      to: { path: "^src/features/[^/]+/views/" },
    },
    {
      name: "data-knows-no-ui",
      severity: "error",
      comment:
        "Repositórios e queries não conhecem ViewModels, Views, stores de tela nem o provider " +
        "da feature (os arquivos na raiz dela).",
      from: { path: "^src/features/[^/]+/data/", pathNot: TEST_CODE },
      to: { path: "^src/features/[^/]+/((views|view-models|stores|testing)/|[^/]+$)" },
    },
    {
      name: "model-is-pure",
      severity: "error",
      comment: "O modelo é a base da feature e não depende de nenhuma outra camada dela.",
      from: { path: "^src/features/[^/]+/model/", pathNot: TEST_CODE },
      to: { path: "^src/features/[^/]+/(?!model/)" },
    },
    {
      name: "no-test-code-in-app",
      severity: "error",
      comment: "Código do app não importa testes, fakes nem utilitários de teste.",
      from: { path: "^src/", pathNot: TEST_CODE },
      to: { path: `^test/|${TEST_CODE}` },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "Ciclo de dependência: separe a responsabilidade ou inverta com um contrato.",
      from: { path: "^src/" },
      to: { circular: true },
    },
    {
      name: "no-navigation-variant-cross",
      severity: "error",
      comment:
        "As variantes de navegação são excludentes: src/app e src/navigation não se conhecem.",
      from: { path: "^src/(app|navigation)/" },
      to: { path: "^src/(app|navigation)/", pathNot: "^src/$1/" },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "Import que não resolve para um arquivo ou pacote instalado.",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "react-native"],
      extensions,
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/(@[^/]+/[^/]+|[^/]+)",
      },
      archi: {
        collapsePattern: "^(src/features/[^/]+/[^/]+|src/[^/]+|test)/",
      },
      text: {
        highlightFocused: true,
      },
    },
  },
}
