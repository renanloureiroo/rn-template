import { darkTheme, lightTheme } from "@/shared/theme/theme"

import { screenMarginOf, type WidthClass, widthClassOf } from "./width-class"

describe("widthClassOf", () => {
  it.each<[number, WidthClass]>([
    [0, "compact"],
    [320, "compact"],
    [599, "compact"],
    [600, "medium"],
    [839, "medium"],
    [840, "expanded"],
    [1280, "expanded"],
  ])("%d pt é %s", (width, widthClass) => {
    expect(widthClassOf(width, lightTheme)).toBe(widthClass)
  })

  it("uma largura maior nunca dá uma classe menor", () => {
    const order: WidthClass[] = ["compact", "medium", "expanded"]
    const ranks = Array.from({ length: 1400 }, (_, width) =>
      order.indexOf(widthClassOf(width, lightTheme)),
    )

    ranks.forEach((rank, width) => expect(rank).toBeGreaterThanOrEqual(ranks[width - 1] ?? 0))
  })
})

describe("screenMarginOf", () => {
  it("dá mais respiro quanto mais larga a classe, igual nos dois temas", () => {
    const margins = (["compact", "medium", "expanded"] as const).map((widthClass) =>
      screenMarginOf(widthClass, lightTheme),
    )

    expect(margins).toEqual([16, 24, 32])
    expect(screenMarginOf("expanded", darkTheme)).toBe(32)
  })
})
