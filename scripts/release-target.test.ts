import { releaseTargetOf } from "./release-target"
import { APP_ENVIRONMENTS } from "../config/app-environments"

const FILES: Readonly<Record<string, string>> = {
  "app.json": JSON.stringify({ slug: "RnTemplate", version: "1.2.3" }),
}

function read(path: string): string {
  const contents = FILES[path]
  if (contents === undefined) {
    throw new Error(`arquivo inexistente no teste: ${path}`)
  }
  return contents
}

describe("releaseTargetOf", () => {
  it("junta identificador, nome, arquivo de variáveis, alvos do Xcode e versão do ambiente", () => {
    const { development } = APP_ENVIRONMENTS

    expect(releaseTargetOf(["development"], read)).toEqual({
      environment: "development",
      applicationId: development.applicationId,
      displayName: development.displayName,
      envFile: ".env.local",
      version: "1.2.3",
      iosTargets: {
        [development.displayName.replace(/[^A-Za-z0-9]/g, "")]: development.applicationId,
      },
    })
  })

  it("mostra o uso quando falta o ambiente", () => {
    expect(() => releaseTargetOf([], read)).toThrow(
      new Error("Uso: npx tsx scripts/release-target.ts <development|production>"),
    )
  })

  it.each(["staging", "qa"])("recusa o ambiente %s", (name) => {
    expect(() => releaseTargetOf([name], read)).toThrow(
      new Error(`Ambiente inválido: ${name} (use development ou production)`),
    )
  })
})
