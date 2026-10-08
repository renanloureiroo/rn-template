import { hasNextPage, offsetOf } from "@/shared/pagination/page"

describe("page", () => {
  it("calcula o deslocamento da página pedida", () => {
    expect(offsetOf({ page: 0, size: 20 })).toBe(0)
    expect(offsetOf({ page: 2, size: 20 })).toBe(40)
  })

  it.each([
    [{ page: 0, size: 20 }, 21, true],
    [{ page: 0, size: 20 }, 20, false],
    [{ page: 1, size: 20 }, 41, true],
    [{ page: 1, size: 20 }, 40, false],
    [{ page: 0, size: 20 }, 0, false],
  ])("sabe se existe página depois de %o com total %i", (request, total, expected) => {
    expect(hasNextPage({ items: [], total }, request)).toBe(expected)
  })
})
