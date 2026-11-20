import type { PropsWithChildren } from "react"
import { act, renderHook } from "@testing-library/react-native"

import {
  createSnackbarQueue,
  type SnackbarQueue,
  SnackbarInsetScope,
  SnackbarQueueProvider,
  useCurrentSnackbar,
  useSnackbar,
  useSnackbarBottomInset,
} from "@/shared/snackbar/snackbar-queue"
import { currentSnackbar } from "@test/support/snackbars"

describe("fila de avisos", () => {
  let queue: SnackbarQueue

  beforeEach(() => {
    queue = createSnackbarQueue()
  })

  function wrapper({ children }: PropsWithChildren) {
    return <SnackbarQueueProvider queue={queue}>{children}</SnackbarQueueProvider>
  }

  it("mostra um aviso por vez, na ordem em que chegaram", async () => {
    const { result } = await renderHook(() => useSnackbar(), { wrapper })

    await act(() => {
      result.current.show({ text: "Nota salva" })
      result.current.show({ text: "Nota apagada" })
    })
    expect(currentSnackbar(queue)?.text).toBe("Nota salva")

    await act(() => queue.getState().actions.dismiss(currentSnackbar(queue)?.id ?? 0))
    expect(currentSnackbar(queue)?.text).toBe("Nota apagada")
  })

  it("não repete o mesmo texto enquanto ele está na fila", async () => {
    const { result } = await renderHook(() => useSnackbar(), { wrapper })

    await act(() => {
      result.current.show({ text: "Sem internet" })
      result.current.show({ text: "Sem internet" })
    })

    expect(queue.getState().queue).toHaveLength(1)
  })

  it("aviso com ação sai quando quem pediu sai; aviso sem ação continua", async () => {
    const { result, unmount } = await renderHook(() => useSnackbar(), { wrapper })
    await act(() => {
      result.current.show({
        text: "Sem internet",
        action: { text: "Tentar de novo", onPress: () => {} },
      })
      result.current.show({ text: "Código novo enviado" })
    })

    await unmount()

    expect(queue.getState().queue.map((queued) => queued.text)).toEqual(["Código novo enviado"])
  })

  it("tirar os próprios avisos com ação deixa o mesmo texto aparecer de novo", async () => {
    const { result } = await renderHook(() => useSnackbar(), { wrapper })
    const other = await renderHook(() => useSnackbar(), { wrapper })
    const undo = { text: "Desfazer", onPress: () => {} }
    await act(() => {
      result.current.show({ text: "Nota salva", action: undo })
      other.result.current.show({ text: "Outro aviso", action: undo })
    })
    const first = currentSnackbar(queue)?.id

    await act(() => {
      result.current.dismissOwn()
      result.current.show({ text: "Nota salva", action: undo })
    })

    expect(queue.getState().queue.map((queued) => queued.text)).toEqual([
      "Outro aviso",
      "Nota salva",
    ])
    expect(queue.getState().queue[1]?.id).not.toBe(first)
  })

  it("o aviso sobe pelo rodapé da tela da frente e volta quando ela sai", async () => {
    const current = await renderHook(() => useCurrentSnackbar(), { wrapper })
    await renderHook(() => useSnackbarBottomInset(96), { wrapper })
    expect(current.result.current.bottomInset).toBe(96)

    const front = await renderHook(() => useSnackbarBottomInset(0), { wrapper })
    expect(current.result.current.bottomInset).toBe(0)

    await front.unmount()
    expect(current.result.current.bottomInset).toBe(96)
  })

  it("dentro de um escopo ativo, o rodapé soma o espaço do escopo (a barra de abas)", async () => {
    const current = await renderHook(() => useCurrentSnackbar(), { wrapper })

    await renderHook(() => useSnackbarBottomInset(0), {
      wrapper: ({ children }: PropsWithChildren) =>
        wrapper({
          children: (
            <SnackbarInsetScope active offset={49}>
              {children}
            </SnackbarInsetScope>
          ),
        }),
    })

    expect(current.result.current.bottomInset).toBe(49)
  })

  it("dentro de um escopo com a barra de abas na lateral, o aviso recua daquele lado", async () => {
    const current = await renderHook(() => useCurrentSnackbar(), { wrapper })

    await renderHook(() => useSnackbarBottomInset(0), {
      wrapper: ({ children }: PropsWithChildren) =>
        wrapper({
          children: (
            <SnackbarInsetScope active offset={0} sides={{ left: 84, right: 0 }}>
              {children}
            </SnackbarInsetScope>
          ),
        }),
    })

    expect(current.result.current.sideInsets).toEqual({ left: 84, right: 0 })
  })

  it("um escopo inativo (aba fora de foco) não informa nada, mesmo montado depois", async () => {
    const current = await renderHook(() => useCurrentSnackbar(), { wrapper })
    await renderHook(() => useSnackbarBottomInset(0), {
      wrapper: ({ children }: PropsWithChildren) =>
        wrapper({ children: <SnackbarInsetScope offset={49}>{children}</SnackbarInsetScope> }),
    })

    const hidden = await renderHook(() => useSnackbarBottomInset(0), {
      wrapper: ({ children }: PropsWithChildren) =>
        wrapper({
          children: (
            <SnackbarInsetScope active={false} offset={0}>
              {children}
            </SnackbarInsetScope>
          ),
        }),
    })

    expect(current.result.current.bottomInset).toBe(49)
    await hidden.unmount()
    expect(current.result.current.bottomInset).toBe(49)
  })

  it("fora do provider, o rodapé não é informado a ninguém", async () => {
    await expect(renderHook(() => useSnackbarBottomInset(96))).resolves.toBeDefined()
  })
})

describe("onDismissed do aviso", () => {
  it("avisa ao sair da fila, pelo tempo, pela ação ou com o dono", () => {
    const queue = createSnackbarQueue()
    const closed: string[] = []
    queue.getState().actions.show({ text: "a", onDismissed: () => closed.push("a") })
    queue.getState().actions.show({ text: "b", onDismissed: () => closed.push("b") }, "dono")

    queue.getState().actions.dismiss(queue.getState().queue[0]!.id)
    queue.getState().actions.dismissOwnedBy("dono")

    expect(closed).toEqual(["a", "b"])
  })
})
