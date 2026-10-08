import { screen } from "@testing-library/react-native"

import { FakeNotesRepository } from "@/features/notes/testing/fake-notes-repository"
import { aNote } from "@/features/notes/testing/note-fixtures"
import { renderNotesScreen } from "@/features/notes/testing/notes-test-setup"
import { NoteDetailScreen } from "@/features/notes/views/NoteDetailScreen"

describe("NoteDetailScreen", () => {
  let notes: FakeNotesRepository

  beforeEach(() => {
    notes = new FakeNotesRepository()
  })

  it("mostra título e data de criação", async () => {
    const note = notes.add(aNote({ title: "Comprar café", createdAt: "2026-03-10T12:00:00.000Z" }))

    await renderNotesScreen(<NoteDetailScreen noteId={note.id} />, { notes })

    expect(await screen.findByText("Comprar café")).toBeOnTheScreen()
    expect(screen.getByText("Criada em 10 mar 2026")).toBeOnTheScreen()
  })

  it("traduz a nota inexistente pelo code note.not_found", async () => {
    await renderNotesScreen(<NoteDetailScreen noteId="nao-existe" />, { notes })

    expect(await screen.findByText("Esta nota não existe mais.")).toBeOnTheScreen()
  })
})
