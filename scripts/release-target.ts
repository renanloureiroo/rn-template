import { IOSConfig } from "expo/config-plugins"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { APP_ENVIRONMENTS, type AppEnvironmentName } from "../config/app-environments"

const ROOT = join(__dirname, "..")
const USAGE = "Uso: npx tsx scripts/release-target.ts <development|production>"

/** O que o fastlane precisa saber de um ambiente para gerar e entregar o binário. */
export interface ReleaseTarget {
  readonly environment: AppEnvironmentName
  readonly applicationId: string
  readonly displayName: string
  readonly envFile: string
  readonly version: string
  /** Bundle identifier de cada alvo do Xcode que o build assina, pelo nome do alvo. */
  readonly iosTargets: Readonly<Record<string, string>>
}

function isEnvironmentName(value: string): value is AppEnvironmentName {
  return value in APP_ENVIRONMENTS
}

function versionOf(appJson: string): string {
  const parsed: unknown = JSON.parse(appJson)
  const version =
    typeof parsed === "object" && parsed !== null && "version" in parsed
      ? parsed.version
      : undefined
  if (typeof version !== "string") {
    throw new Error("app.json sem version")
  }
  return version
}

export function releaseTargetOf(
  args: readonly string[],
  read: (path: string) => string,
): ReleaseTarget {
  const [name] = args
  if (name === undefined) {
    throw new Error(USAGE)
  }
  if (!isEnvironmentName(name)) {
    throw new Error(`Ambiente inválido: ${name} (use development ou production)`)
  }
  const environment = APP_ENVIRONMENTS[name]
  return {
    environment: environment.name,
    applicationId: environment.applicationId,
    displayName: environment.displayName,
    envFile: environment.envFile,
    version: versionOf(read("app.json")),
    iosTargets: {
      [IOSConfig.XcodeUtils.sanitizedName(environment.displayName)]: environment.applicationId,
    },
  }
}

if (require.main === module) {
  try {
    const target = releaseTargetOf(process.argv.slice(2), (path) =>
      readFileSync(join(ROOT, path), "utf8"),
    )
    process.stdout.write(`${JSON.stringify(target)}\n`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
