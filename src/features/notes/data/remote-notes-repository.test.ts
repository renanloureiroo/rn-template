import { RemoteNotesRepository } from "@/features/notes/data/remote-notes-repository"
import { aNote } from "@/features/notes/testing/note-fixtures"
import { ErrorType } from "@/shared/errors/app-error"
import { HttpClient } from "@/shared/http/http-client"
import { FakeFetch } from "@test/support/fake-fetch"

describe("RemoteNotesRepository", () => {
  let server: FakeFetch
  let sut: RemoteNotesRepository

  beforeEach(() => {
    server = new FakeFetch()
    sut = new RemoteNotesRepository(
      new HttpClient({ baseUrl: "http://api.test/api", fetch: server.fetch }),
    )
  })

  it("cria pela API e devolve a nota que o servidor criou", async () => {
    const response = aNote({ title: "Nota" })
    server.respondWith(201, response)

    const note = await sut.create("Nota")

    expect(server.lastRequest()).toMatchObject({
      method: "POST",
      url: "http://api.test/api/notes",
      body: { title: "Nota" },
    })
    expect(note).toEqual(response)
  })

  it("busca a nota pelo identificador", async () => {
    const response = aNote()
    server.respondWith(200, response)

    const note = await sut.findById(response.id)

    expect(server.lastRequest().url).toBe(`http://api.test/api/notes/${response.id}`)
    expect(note).toEqual(response)
  })

  it("traduz o 404 do servidor em ausência", async () => {
    server.respondWithProblem(404, { code: "note.not_found" })

    await expect(sut.findById("123")).resolves.toBeNull()
  })

  it("propaga erro que não é ausência", async () => {
    server.respondWithProblem(503, { code: "internal.unavailable" })

    await expect(sut.findById("123")).rejects.toMatchObject({ type: ErrorType.UNAVAILABLE })
  })

  it("lista a página pedida e o total", async () => {
    const items = [aNote(), aNote()]
    server.respondWith(200, { items, total: 7 })

    const page = await sut.list({ page: 1, size: 2 })

    expect(server.lastRequest().url).toBe("http://api.test/api/notes?page=1&size=2")
    expect(page).toEqual({ items, total: 7 })
  })

  it.each([
    ["sem id", { ...aNote(), id: "" }],
    ["sem título", { ...aNote(), title: undefined }],
    ["com data inválida", { ...aNote(), createdAt: "ontem" }],
  ])("falha com erro inesperado quando o servidor quebra o contrato (%s)", async (_, body) => {
    server.respondWith(200, body)

    await expect(sut.findById("123")).rejects.toMatchObject({
      type: ErrorType.UNEXPECTED,
      code: "internal.unexpected",
    })
  })
})
