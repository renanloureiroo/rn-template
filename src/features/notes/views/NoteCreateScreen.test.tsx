import { fireEvent, screen, waitFor } from "@testing-library/react-native"

import { createNoteDraftStore } from "@/features/notes/stores/note-draft-store"
import { FakeNotesRepository } from "@/features/notes/testing/fake-notes-repository"
import { renderNotesScreen } from "@/features/notes/testing/notes-test-setup"
import { NoteCreateScreen } from "@/features/notes/views/NoteCreateScreen"

describe("NoteCreateScreen", () => {
  let notes: FakeNotesRepository
  let created: string[]

  beforeEach(() => {
    notes = new FakeNotesRepository()
    created = []
  })

  it("cria a nota, limpa o rascunho e avisa a navegação", async () => {
    const draft = createNoteDraftStore()
    await renderNotesScreen(<NoteCreateScreen onCreated={(id) => created.push(id)} />, {
      notes,
      draft,
    })

    await fireEvent.changeText(screen.getByTestId("note-title-input"), "Comprar café")
    await fireEvent.press(screen.getByText("Salvar"))

    await waitFor(() => expect(created).toHaveLength(1))
    const [saved] = notes.all()
    expect(saved?.title).toBe("Comprar café")
    expect(created).toEqual([saved?.id])
    expect(draft.getState().title).toBe("")
  })

  it("mostra a mensagem da regra do modelo e não cria nada", async () => {
    await renderNotesScreen(<NoteCreateScreen onCreated={(id) => created.push(id)} />, { notes })

    await fireEvent.changeText(screen.getByTestId("note-title-input"), "   ")
    await fireEvent.press(screen.getByText("Salvar"))

    expect(
      await screen.findByText("O título é obrigatório e pode ter no máximo 120 caracteres."),
    ).toBeOnTheScreen()
    expect(notes.all()).toEqual([])
    expect(created).toEqual([])
  })

  it("recupera o rascunho guardado na store ao voltar para a tela", async () => {
    const draft = createNoteDraftStore({ title: "Rascunho anterior" })

    await renderNotesScreen(<NoteCreateScreen onCreated={() => {}} />, { notes, draft })

    expect(screen.getByDisplayValue("Rascunho anterior")).toBeOnTheScreen()
    expect(screen.getByText("17 de 120 caracteres")).toBeOnTheScreen()
  })
})
