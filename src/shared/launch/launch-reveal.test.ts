import { act, renderHook } from "@testing-library/react-native"

import { launchReveal, useLaunchRevealed } from "@/shared/launch/launch-reveal"

describe("launchReveal", () => {
  beforeEach(() => launchReveal.conceal())

  it("começa falso e vira verdadeiro quando a abertura revela", async () => {
    const { result } = await renderHook(() => useLaunchRevealed())
    expect(result.current).toBe(false)

    await act(async () => launchReveal.reveal())

    expect(result.current).toBe(true)
  })

  it("revelar de novo não muda nada", async () => {
    launchReveal.reveal()
    const { result } = await renderHook(() => useLaunchRevealed())

    await act(async () => launchReveal.reveal())

    expect(result.current).toBe(true)
  })
})
