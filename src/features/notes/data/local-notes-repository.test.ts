import { LocalNotesRepository } from "@/features/notes/data/local-notes-repository"
import { InMemoryKeyValueStorage } from "@test/support/in-memory-key-value-storage"

describe("LocalNotesRepository", () => {
  let storage: InMemoryKeyValueStorage
  let ids: string[]
  let instants: Date[]

  function repository(): LocalNotesRepository {
    return new LocalNotesRepository(storage, {
      newId: () => ids.shift() ?? "",
      now: () => instants.shift() ?? new Date(0),
    })
  }

  beforeEach(() => {
    storage = new InMemoryKeyValueStorage()
    ids = ["id-1", "id-2", "id-3"]
    instants = [
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-02T00:00:00.000Z"),
      new Date("2026-01-03T00:00:00.000Z"),
    ]
  })

  it("atribui identidade e instante de criação, como a API faria", async () => {
    const note = await repository().create("Nota")

    expect(note).toEqual({ id: "id-1", title: "Nota", createdAt: "2026-01-01T00:00:00.000Z" })
  })

  it("persiste no armazenamento do dispositivo entre instâncias", async () => {
    const created = await repository().create("Nota")

    const found = await repository().findById(created.id)

    expect(found).toEqual(created)
    expect(storage.keys()).toEqual([LocalNotesRepository.KEY])
  })

  it("devolve null para nota inexistente", async () => {
    await expect(repository().findById("nao-existe")).resolves.toBeNull()
  })

  it("lista paginado, mais recentes primeiro", async () => {
    const sut = repository()
    for (const title of ["Primeira", "Segunda", "Terceira"]) {
      await sut.create(title)
    }

    const first = await sut.list({ page: 0, size: 2 })
    const second = await sut.list({ page: 1, size: 2 })

    expect(first.items.map((note) => note.title)).toEqual(["Terceira", "Segunda"])
    expect(second.items.map((note) => note.title)).toEqual(["Primeira"])
    expect(first.total).toBe(3)
  })
})
