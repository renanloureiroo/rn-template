import { getConfig } from "@expo/config"

import { APP_ENVIRONMENTS, type AppEnvironmentName } from "./config/app-environments"

describe("app.config", () => {
  const previous = process.env.APP_ENV

  afterEach(() => {
    process.env.APP_ENV = previous
  })

  it("não trava a orientação e responde à janela com orientation default", () => {
    const { exp } = getConfig(__dirname, { skipSDKVersionRequirement: true })

    expect(exp.orientation).toBe("default")
  })

  it.each<AppEnvironmentName>(["development"])(
    "usa nome, identificador e esquema do ambiente %s",
    (name) => {
      process.env.APP_ENV = name
      const environment = APP_ENVIRONMENTS[name]

      const { exp } = getConfig(__dirname, { skipSDKVersionRequirement: true })

      expect(exp.name).toBe(environment.displayName)
      expect(exp.scheme).toBe(environment.scheme)
      expect(exp.ios?.bundleIdentifier).toBe(environment.applicationId)
      expect(exp.android?.package).toBe(environment.applicationId)
    },
  )
})
