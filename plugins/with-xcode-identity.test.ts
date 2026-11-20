import { withIdentitySettings } from "./with-xcode-identity"

const SETTINGS = {
  INFOPLIST_FILE: "RnTemplateDev/Info.plist",
  PRODUCT_BUNDLE_IDENTIFIER: "com.rntemplate.dev",
  PRODUCT_NAME: "RnTemplateDev",
}

describe("with-xcode-identity", () => {
  it("grava nome e categoria entre aspas e mantém o resto", () => {
    const sut = withIdentitySettings(SETTINGS, {
      displayName: "RnTemplate Dev",
      category: "public.app-category.productivity",
    })

    expect(sut).toEqual({
      ...SETTINGS,
      INFOPLIST_KEY_CFBundleDisplayName: '"RnTemplate Dev"',
      INFOPLIST_KEY_LSApplicationCategoryType: '"public.app-category.productivity"',
    })
  })

  it("rodar de novo substitui os valores em vez de acumular", () => {
    const first = withIdentitySettings(SETTINGS, {
      displayName: "RnTemplate Dev",
      category: "public.app-category.productivity",
    })

    const sut = withIdentitySettings(first, {
      displayName: "RnTemplate",
      category: "public.app-category.productivity",
    })

    expect(sut.INFOPLIST_KEY_CFBundleDisplayName).toBe('"RnTemplate"')
  })

  it("sem categoria, tira o build setting dela", () => {
    const withCategory = withIdentitySettings(SETTINGS, {
      displayName: "RnTemplate",
      category: "public.app-category.productivity",
    })

    const sut = withIdentitySettings(withCategory, {
      displayName: "RnTemplate",
      category: undefined,
    })

    expect(sut).not.toHaveProperty("INFOPLIST_KEY_LSApplicationCategoryType")
    expect(sut.INFOPLIST_KEY_CFBundleDisplayName).toBe('"RnTemplate"')
  })
})
