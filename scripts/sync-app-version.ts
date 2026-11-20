import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(__dirname, "..")
const ROOT_VERSION_FIELD = /^ {2}"version": "[^"]*"/m

function versionOf(packageJson: string): string {
  const parsed: unknown = JSON.parse(packageJson)
  const version =
    typeof parsed === "object" && parsed !== null && "version" in parsed
      ? parsed.version
      : undefined
  if (typeof version !== "string") {
    throw new Error("package.json sem version")
  }
  return version
}

export function appJsonWithVersionOf(appJson: string, packageJson: string): string {
  if (!ROOT_VERSION_FIELD.test(appJson)) {
    throw new Error("app.json sem version")
  }
  return appJson.replace(ROOT_VERSION_FIELD, `  "version": "${versionOf(packageJson)}"`)
}

if (require.main === module) {
  try {
    const appJsonPath = join(ROOT, "app.json")
    const synced = appJsonWithVersionOf(
      readFileSync(appJsonPath, "utf8"),
      readFileSync(join(ROOT, "package.json"), "utf8"),
    )
    writeFileSync(appJsonPath, synced)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
