import { createAppDependencies } from "@/bootstrap/app-dependencies"
import { loadEnvironment } from "@/bootstrap/environment"
import { LocalNotesRepository } from "@/features/notes/data/local-notes-repository"
import { RemoteNotesRepository } from "@/features/notes/data/remote-notes-repository"
import { InMemoryKeyValueStorage } from "@test/support/in-memory-key-value-storage"

describe("createAppDependencies", () => {
  it("guarda as notas no dispositivo por padrão", () => {
    const sut = createAppDependencies(loadEnvironment({}), new InMemoryKeyValueStorage())

    expect(sut.notes.notesRepository).toBeInstanceOf(LocalNotesRepository)
  })

  it("usa a API quando EXPO_PUBLIC_NOTES_DATA_SOURCE=remote", () => {
    const sut = createAppDependencies(
      loadEnvironment({ EXPO_PUBLIC_NOTES_DATA_SOURCE: "remote" }),
      new InMemoryKeyValueStorage(),
    )

    expect(sut.notes.notesRepository).toBeInstanceOf(RemoteNotesRepository)
  })

  it("compartilha o mesmo armazenamento entre o app e as features", async () => {
    const storage = new InMemoryKeyValueStorage()
    const sut = createAppDependencies(loadEnvironment({}), storage)

    await sut.notes.notesRepository.create("Nota")

    expect(sut.storage).toBe(storage)
    expect(storage.keys()).toEqual([LocalNotesRepository.KEY])
  })
})
