import { AppError, ErrorType } from "@/shared/errors/app-error"
import { HttpClient } from "@/shared/http/http-client"
import { HttpError } from "@/shared/http/http-errors"
import { FakeFetch } from "@test/support/fake-fetch"

describe("HttpClient", () => {
  let server: FakeFetch
  let sut: HttpClient

  beforeEach(() => {
    server = new FakeFetch()
    sut = new HttpClient({ baseUrl: "http://api.test/api/", fetch: server.fetch, timeoutMs: 50 })
  })

  it("monta a URL com a base, o caminho e a query, ignorando valores ausentes", async () => {
    server.respondWith(200, [])

    await sut.request({
      method: "GET",
      path: "notes",
      query: { page: 0, q: "café", size: undefined },
    })

    expect(server.lastRequest().url).toBe("http://api.test/api/notes?page=0&q=caf%C3%A9")
  })

  it("envia o corpo em JSON e devolve status e corpo da resposta", async () => {
    server.respondWith(201, { id: "1" })

    const response = await sut.request({ method: "POST", path: "/notes", body: { title: "Nota" } })

    expect(response).toEqual({ status: 201, body: { id: "1" } })
    expect(server.lastRequest()).toMatchObject({
      method: "POST",
      body: { title: "Nota" },
      headers: { "Content-Type": "application/json" },
    })
  })

  it("aceita resposta sem corpo", async () => {
    server.respondWith(204)

    await expect(sut.request({ method: "DELETE", path: "/notes/1" })).resolves.toEqual({
      status: 204,
      body: undefined,
    })
  })

  it("traduz problem+json em HttpError preservando o code do servidor", async () => {
    server.respondWithProblem(404, {
      code: "note.not_found",
      detail: "Nota não encontrada",
      traceId: "abc123",
    })

    const error = await sut.request({ method: "GET", path: "/notes/1" }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({
      type: ErrorType.NOT_FOUND,
      code: "note.not_found",
      status: 404,
      traceId: "abc123",
    })
  })

  it.each([
    [400, ErrorType.VALIDATION],
    [401, ErrorType.UNAUTHORIZED],
    [403, ErrorType.FORBIDDEN],
    [404, ErrorType.NOT_FOUND],
    [409, ErrorType.CONFLICT],
    [422, ErrorType.BUSINESS_RULE],
    [503, ErrorType.UNAVAILABLE],
    [500, ErrorType.UNEXPECTED],
  ])("mapeia o status %i para %s", async (status, type) => {
    server.respondWithProblem(status, { code: "context.reason" })

    await expect(sut.request({ method: "GET", path: "/x" })).rejects.toMatchObject({
      type,
      code: "context.reason",
    })
  })

  it.each([
    [400, "request.invalid"],
    [404, "request.not_found"],
    [500, "internal.unexpected"],
  ])("usa o código reservado da borda quando o corpo não traz code (%i)", async (status, code) => {
    server.respondWith(status, "<html>erro</html>")

    await expect(sut.request({ method: "GET", path: "/x" })).rejects.toMatchObject({ code })
  })

  it("traduz falha de conexão em erro de rede indisponível", async () => {
    server.failWith(new TypeError("Network request failed"))

    const error = await sut.request({ method: "GET", path: "/x" }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ type: ErrorType.UNAVAILABLE, code: "network.unavailable" })
  })

  it("aborta a requisição e lança timeout quando o servidor não responde", async () => {
    server.hang()

    await expect(sut.request({ method: "GET", path: "/x" })).rejects.toMatchObject({
      type: ErrorType.UNAVAILABLE,
      code: "network.timeout",
    })
  })
})
