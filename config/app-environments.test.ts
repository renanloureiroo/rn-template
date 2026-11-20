import {
  APP_ENVIRONMENTS,
  type AppEnvironmentName,
  appEnvironmentOf,
  buildNumberOf,
  type EnvironmentVariables,
  loadAppEnvFile,
} from "./app-environments"

const NAMES: readonly AppEnvironmentName[] = ["development", "production"]

function envFilesOf(files: Readonly<Record<string, string>>): (path: string) => string | null {
  return (path) => files[path] ?? null
}

describe("APP_ENVIRONMENTS", () => {
  it("dá um identificador distinto a cada ambiente, com o sufixo .dev na Dev", () => {
    expect(APP_ENVIRONMENTS.development.applicationId).toBe(
      `${APP_ENVIRONMENTS.production.applicationId}.dev`,
    )
  })

  it("dá um esquema de link distinto a cada ambiente", () => {
    const schemes = NAMES.map((name) => APP_ENVIRONMENTS[name].scheme)

    expect(new Set(schemes).size).toBe(NAMES.length)
  })

  it("marca a versão Dev no nome", () => {
    expect(APP_ENVIRONMENTS.development.displayName).toBe(
      `${APP_ENVIRONMENTS.production.displayName} Dev`,
    )
  })

  it("lê as variáveis de cada ambiente do arquivo dele", () => {
    expect(APP_ENVIRONMENTS.development.envFile).toBe(".env.local")
    expect(APP_ENVIRONMENTS.production.envFile).toBe(".env")
  })

  it("usa a variante Dev do ícone em development", () => {
    expect(APP_ENVIRONMENTS.development.icon.ios).toBe("./assets/images/app-icon-dev-ios.png")
    expect(APP_ENVIRONMENTS.production.icon.ios).toBe("./assets/images/app-icon-ios.png")
  })
})

describe("appEnvironmentOf", () => {
  it.each([undefined, ""])("usa development quando APP_ENV é %j", (value) => {
    expect(appEnvironmentOf(value)).toBe(APP_ENVIRONMENTS.development)
  })

  it.each(NAMES)("devolve o ambiente %s", (name) => {
    expect(appEnvironmentOf(name)).toBe(APP_ENVIRONMENTS[name])
  })

  it("recusa ambiente desconhecido", () => {
    expect(() => appEnvironmentOf("staging")).toThrow(
      new Error("APP_ENV inválido: staging (use development ou production)"),
    )
  })
})

describe("buildNumberOf", () => {
  it.each([undefined, "", "  "])("não fixa número quando APP_BUILD_NUMBER é %j", (value) => {
    expect(buildNumberOf(value)).toBeUndefined()
  })

  it.each([
    ["1", 1],
    ["42", 42],
    ["2100000000", 2_100_000_000],
  ])("lê %s como %d", (value, expected) => {
    expect(buildNumberOf(value)).toBe(expected)
  })

  it.each(["0", "-3", "1.5", "abc", "2100000001"])("recusa %s", (value) => {
    expect(() => buildNumberOf(value)).toThrow(
      new Error(`APP_BUILD_NUMBER inválido: ${value} (use um inteiro de 1 a 2100000000)`),
    )
  })
})

describe("loadAppEnvFile", () => {
  const PRODUCTION_FILE = [
    "EXPO_PUBLIC_API_URL=https://api.example.com/api",
    "EXPO_PUBLIC_NOTES_DATA_SOURCE=remote",
  ].join("\n")
  const read = envFilesOf({ ".env": PRODUCTION_FILE })

  it("aplica os valores do arquivo do ambiente por cima dos carregados pelo Expo", () => {
    const env: EnvironmentVariables = {
      EXPO_PUBLIC_API_URL: "http://localhost:8080/api",
      EXPO_PUBLIC_NOTES_DATA_SOURCE: "local",
      __EXPO_ENV_LOADED: JSON.stringify(["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_NOTES_DATA_SOURCE"]),
    }

    loadAppEnvFile(APP_ENVIRONMENTS.production, { env, read })

    expect(env.EXPO_PUBLIC_API_URL).toBe("https://api.example.com/api")
    expect(env.EXPO_PUBLIC_NOTES_DATA_SOURCE).toBe("remote")
  })

  it("remove as EXPO_PUBLIC_* que o Expo carregou de outro arquivo e o do ambiente não define", () => {
    const env: EnvironmentVariables = {
      EXPO_PUBLIC_DEBUG_PANEL: "true",
      __EXPO_ENV_LOADED: JSON.stringify(["EXPO_PUBLIC_DEBUG_PANEL"]),
    }

    loadAppEnvFile(APP_ENVIRONMENTS.production, { env, read })

    expect(env).not.toHaveProperty("EXPO_PUBLIC_DEBUG_PANEL")
  })

  it("mantém a variável definida no shell", () => {
    const env: EnvironmentVariables = {
      EXPO_PUBLIC_API_URL: "http://shell/api",
      __EXPO_ENV_LOADED: JSON.stringify([]),
    }

    loadAppEnvFile(APP_ENVIRONMENTS.production, { env, read })

    expect(env.EXPO_PUBLIC_API_URL).toBe("http://shell/api")
    expect(env.EXPO_PUBLIC_NOTES_DATA_SOURCE).toBe("remote")
  })

  it("lê o .env.local em development", () => {
    const env: EnvironmentVariables = {}

    loadAppEnvFile(APP_ENVIRONMENTS.development, {
      env,
      read: envFilesOf({ ".env.local": "EXPO_PUBLIC_API_URL=http://local/api" }),
    })

    expect(env.EXPO_PUBLIC_API_URL).toBe("http://local/api")
  })

  it("tolera o arquivo ausente em development", () => {
    const env: EnvironmentVariables = {}

    loadAppEnvFile(APP_ENVIRONMENTS.development, { env, read: envFilesOf({}) })

    expect(env).toEqual({})
  })

  it("exige o arquivo em production", () => {
    const load = () =>
      loadAppEnvFile(APP_ENVIRONMENTS.production, { env: {}, read: envFilesOf({}) })

    expect(load).toThrow(new Error("Arquivo .env ausente para APP_ENV=production"))
  })
})
