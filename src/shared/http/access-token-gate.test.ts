import { AccessTokenGate } from "@/shared/http/access-token-gate"
import { FakeSessionTokens } from "@test/support/fake-session-tokens"

describe("AccessTokenGate", () => {
  let session: FakeSessionTokens
  let sut: AccessTokenGate
  let repeated: string[]

  function repeatAs(label: string): (token: string) => Promise<string> {
    return async (token) => {
      repeated.push(`${label}:${token}`)
      return label
    }
  }

  beforeEach(() => {
    repeated = []
    session = new FakeSessionTokens("velho")
    sut = new AccessTokenGate({
      accessToken: session.accessToken,
      refreshAccessToken: session.refreshAccessToken,
    })
  })

  it("entrega o token atual da sessão", async () => {
    await expect(sut.acquire()).resolves.toEqual({ token: "velho", generation: 0 })
  })

  it("renova só no primeiro 401 e refaz ele antes dos que esperavam na fila, na ordem de chegada", async () => {
    session.renewTo("novo").hold()
    const [a, b, c] = [await sut.acquire(), await sut.acquire(), await sut.acquire()]

    const retries = Promise.all([
      sut.retry(a, repeatAs("a")),
      sut.retry(b, repeatAs("b")),
      sut.retry(c, repeatAs("c")),
    ])
    session.release()

    await expect(retries).resolves.toEqual(["a", "b", "c"])
    expect(repeated).toEqual(["a:novo", "b:novo", "c:novo"])
    expect(session.refreshes).toBe(1)
  })

  it("segura o pedido novo na fila e o libera depois de refazer o que disparou a renovação", async () => {
    session.renewTo("novo").hold()
    const rejected = await sut.acquire()

    const retry = sut.retry(rejected, repeatAs("a"))
    const next = sut.acquire().then((issued) => {
      repeated.push(`novo pedido:${issued.token}`)
      return issued
    })
    session.release()

    await expect(next).resolves.toEqual({ token: "novo", generation: 1 })
    await retry
    expect(repeated).toEqual(["a:novo", "novo pedido:novo"])
  })

  it("refaz com o token atual, sem renovar de novo, o 401 de um token já renovado", async () => {
    session.renewTo("novo")
    const first = await sut.acquire()
    const late = await sut.acquire()

    await sut.retry(first, repeatAs("a"))

    await expect(sut.retry(late, repeatAs("b"))).resolves.toBe("b")
    expect(repeated).toEqual(["a:novo", "b:novo"])
    expect(session.refreshes).toBe(1)
  })

  it("renova de novo quando o token novo também é recusado", async () => {
    session.renewTo("novo").renewTo("mais-novo")
    await sut.retry(await sut.acquire(), repeatAs("a"))

    await sut.retry(await sut.acquire(), repeatAs("b"))

    expect(repeated).toEqual(["a:novo", "b:mais-novo"])
    expect(session.refreshes).toBe(2)
  })

  it("não refaz o pedido que saiu sem token", async () => {
    await expect(sut.retry({ token: null, generation: 0 }, repeatAs("a"))).resolves.toBeNull()
    expect(session.refreshes).toBe(0)
  })

  it("não refaz sem função de renovação", async () => {
    const withoutRefresh = new AccessTokenGate({ accessToken: session.accessToken })

    await expect(
      withoutRefresh.retry(await withoutRefresh.acquire(), repeatAs("a")),
    ).resolves.toBeNull()
  })

  it("devolve null a todos, sem refazer, quando a sessão acabou", async () => {
    session.renewTo(null)
    const first = await sut.acquire()
    const second = await sut.acquire()

    const retries = Promise.all([sut.retry(first, repeatAs("a")), sut.retry(second, repeatAs("b"))])

    await expect(retries).resolves.toEqual([null, null])
    expect(repeated).toEqual([])
  })

  it("avisa uma vez que a sessão acabou quando a renovação devolve null", async () => {
    let ended = 0
    const notified = new AccessTokenGate({
      accessToken: session.accessToken,
      refreshAccessToken: session.refreshAccessToken,
      onSessionEnded: () => {
        ended += 1
      },
    })
    session.renewTo(null).hold()
    const first = await notified.acquire()
    const second = await notified.acquire()

    const retries = Promise.all([
      notified.retry(first, repeatAs("a")),
      notified.retry(second, repeatAs("b")),
    ])
    session.release()

    await expect(retries).resolves.toEqual([null, null])
    expect(ended).toBe(1)
  })

  it("não avisa o fim da sessão quando a renovação traz token nem quando o pedido saiu sem ele", async () => {
    let ended = 0
    const notified = new AccessTokenGate({
      accessToken: async () => null,
      refreshAccessToken: session.refreshAccessToken,
      onSessionEnded: () => {
        ended += 1
      },
    })

    await expect(notified.retry(await notified.acquire(), repeatAs("a"))).resolves.toBeNull()
    expect(ended).toBe(0)
    expect(session.refreshes).toBe(0)
  })

  it("entrega a falha da renovação a toda a fila e desliga o semáforo", async () => {
    const failure = new Error("sem rede")
    session.failRenewalWith(failure).renewTo("novo").hold()
    const first = await sut.acquire()
    const second = await sut.acquire()

    const retries = Promise.allSettled([
      sut.retry(first, repeatAs("a")),
      sut.retry(second, repeatAs("b")),
    ])
    const next = sut.acquire()
    session.release()

    await expect(retries).resolves.toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ])
    await expect(next).resolves.toEqual({ token: "velho", generation: 1 })
    await expect(sut.retry(await next, repeatAs("c"))).resolves.toBe("c")
    expect(session.refreshes).toBe(2)
  })
})
