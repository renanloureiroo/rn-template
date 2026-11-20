import { appJsonWithVersionOf } from "./sync-app-version"

const APP_JSON = `{
  "slug": "RnTemplate",
  "version": "1.0.2",
  "assetBundlePatterns": ["**/*"],
  "plugins": [
    {
      "version": "9.9.9"
    }
  ]
}
`

describe("appJsonWithVersionOf", () => {
  it("troca só a versão da raiz e mantém o resto do texto", () => {
    expect(appJsonWithVersionOf(APP_JSON, JSON.stringify({ version: "1.1.0" }))).toBe(
      APP_JSON.replace('"version": "1.0.2"', '"version": "1.1.0"'),
    )
  })

  it("recusa app.json sem a versão na raiz", () => {
    expect(() =>
      appJsonWithVersionOf('{\n  "slug": "RnTemplate"\n}\n', JSON.stringify({ version: "1.1.0" })),
    ).toThrow(new Error("app.json sem version"))
  })

  it("recusa package.json sem versão", () => {
    expect(() => appJsonWithVersionOf(APP_JSON, JSON.stringify({ name: "rn-template" }))).toThrow(
      new Error("package.json sem version"),
    )
  })
})
