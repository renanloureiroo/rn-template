import { ExpoHaptics } from "@/shared/haptics/expo-haptics"
import { hapticsFake } from "@test/support/expo-haptics-fake"

describe("ExpoHaptics", () => {
  beforeEach(() => hapticsFake.reset())

  it("no iOS, usa os geradores de seleção, impacto e notificação", () => {
    const sut = new ExpoHaptics("ios")

    sut.play("selection")
    sut.play("longPress")
    sut.play("impact")
    sut.play("warning")
    sut.play("error")

    expect(hapticsFake.played).toEqual([
      "selection",
      "impact:medium",
      "impact:light",
      "notification:warning",
      "notification:error",
    ])
  })

  it("no Android, usa o motor de toque do sistema", () => {
    const sut = new ExpoHaptics("android")

    sut.play("selection")
    sut.play("longPress")
    sut.play("impact")
    sut.play("warning")
    sut.play("error")

    expect(hapticsFake.played).toEqual([
      "android:segment-tick",
      "android:long-press",
      "android:confirm",
      "android:reject",
      "android:reject",
    ])
  })

  it("sem motor de vibração, não falha", async () => {
    hapticsFake.failNext = true
    const sut = new ExpoHaptics("ios")

    expect(() => sut.play("error")).not.toThrow()
    await Promise.resolve()

    expect(hapticsFake.played).toEqual(["notification:error"])
  })
})
