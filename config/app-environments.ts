import { LOADED_ENV_NAME, parseEnv } from "@expo/env"
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"

/** Os ambientes do app, escolhidos por `APP_ENV`. */
export type AppEnvironmentName = "development" | "production"

/** Tudo o que muda de um ambiente para outro no build: nome, identificador, ícone e arquivos. */
export interface AppEnvironment {
  readonly name: AppEnvironmentName
  readonly displayName: string
  /** Mesmo identificador no iOS (`bundleIdentifier`) e no Android (`package`). */
  readonly applicationId: string
  readonly scheme: string
  readonly icon: {
    readonly ios: string
    readonly androidLegacy: string
    readonly androidAdaptiveForeground: string
    readonly androidAdaptiveBackground: string
  }
  /** Arquivo, na raiz do projeto, com as `EXPO_PUBLIC_*` do ambiente. */
  readonly envFile: string
}

const APP_NAME = "RnTemplate"
const APPLICATION_ID = "com.rntemplate"
const SCHEME = "rntemplate"
const PROJECT_ROOT = resolve(__dirname, "..")

function iconsOf(variant: "" | "dev"): AppEnvironment["icon"] {
  const base = variant === "" ? "./assets/images/app-icon" : `./assets/images/app-icon-${variant}`
  return {
    ios: `${base}-ios.png`,
    androidLegacy: `${base}-android-legacy.png`,
    androidAdaptiveForeground: `${base}-android-adaptive-foreground.png`,
    androidAdaptiveBackground: `${base}-android-adaptive-background.png`,
  }
}

/**
 * A versão Dev convive com a de produção no mesmo aparelho: identificador, esquema de link, nome e
 * ícone próprios. Ela é também a versão de teste entregue aos testadores.
 */
export const APP_ENVIRONMENTS: Readonly<Record<AppEnvironmentName, AppEnvironment>> = {
  development: {
    name: "development",
    displayName: `${APP_NAME} Dev`,
    applicationId: `${APPLICATION_ID}.dev`,
    scheme: `${SCHEME}-dev`,
    icon: iconsOf("dev"),
    envFile: ".env.local",
  },
  production: {
    name: "production",
    displayName: APP_NAME,
    applicationId: APPLICATION_ID,
    scheme: SCHEME,
    icon: iconsOf(""),
    envFile: ".env",
  },
}

const NAMES = Object.keys(APP_ENVIRONMENTS) as AppEnvironmentName[]

function isAppEnvironmentName(value: string): value is AppEnvironmentName {
  return (NAMES as string[]).includes(value)
}

/** O ambiente pedido por `APP_ENV`; sem valor, `development`. Valor desconhecido lança. */
export function appEnvironmentOf(value: string | undefined): AppEnvironment {
  if (value === undefined || value === "") {
    return APP_ENVIRONMENTS.development
  }
  if (!isAppEnvironmentName(value)) {
    throw new Error(`APP_ENV inválido: ${value} (use development ou production)`)
  }
  return APP_ENVIRONMENTS[value]
}

const MAX_BUILD_NUMBER = 2_100_000_000

/**
 * O número do build pedido por `APP_BUILD_NUMBER`, que vira o `buildNumber` do iOS e o
 * `versionCode` do Android. Sem valor, `undefined`. Valor que não é inteiro entre 1 e o máximo do
 * Google Play lança.
 */
export function buildNumberOf(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined
  }
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1 || number > MAX_BUILD_NUMBER) {
    throw new Error(
      `APP_BUILD_NUMBER inválido: ${value} (use um inteiro de 1 a ${MAX_BUILD_NUMBER})`,
    )
  }
  return number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readOptionalProjectFile(path: string): string | null {
  try {
    return readFileSync(join(PROJECT_ROOT, path), "utf8")
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      return null
    }
    throw error
  }
}

/** Variáveis de ambiente do processo, como o `process.env`. */
export type EnvironmentVariables = Record<string, string | undefined>

function loadedKeysOf(env: EnvironmentVariables): readonly string[] {
  const marker = env[LOADED_ENV_NAME]
  if (marker === undefined) {
    return []
  }
  const parsed: unknown = JSON.parse(marker)
  return Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string") : []
}

export interface LoadAppEnvFileOptions {
  /** Conteúdo do arquivo pelo caminho relativo à raiz; `null` quando não existe. */
  readonly read?: (path: string) => string | null
  readonly env?: EnvironmentVariables
}

/**
 * Faz do arquivo do ambiente (`envFile`) a fonte das `EXPO_PUBLIC_*`, por cima dos arquivos que o
 * Expo escolheu pelo `NODE_ENV`: aplica os valores dele e remove as `EXPO_PUBLIC_*` que o Expo
 * carregou de outro arquivo e que ele não define. Variável definida no shell continua valendo.
 * Em `production` a falta do arquivo lança; em `development`, é tolerada.
 */
export function loadAppEnvFile(
  environment: AppEnvironment,
  { read = readOptionalProjectFile, env = process.env }: LoadAppEnvFileOptions = {},
): void {
  const contents = read(environment.envFile)
  if (contents === null) {
    if (environment.name === "development") {
      return
    }
    throw new Error(`Arquivo ${environment.envFile} ausente para APP_ENV=${environment.name}`)
  }

  const values = parseEnv(contents, env)
  const loadedByExpo = new Set(loadedKeysOf(env))
  const loaded = new Set<string>()

  for (const key of loadedByExpo) {
    if (key.startsWith("EXPO_PUBLIC_") && !(key in values)) {
      delete env[key]
    } else {
      loaded.add(key)
    }
  }
  for (const [key, value] of Object.entries(values)) {
    if (loadedByExpo.has(key) || env[key] === undefined) {
      env[key] = value
      loaded.add(key)
    }
  }

  env[LOADED_ENV_NAME] = JSON.stringify([...loaded])
}
