import { renderHook, waitFor } from "@testing-library/react-native"

import { aNote } from "@/features/notes/testing/note-fixtures"
import { createNotesTestSetup } from "@/features/notes/testing/notes-test-setup"
import { useNoteDetailViewModel } from "@/features/notes/view-models/use-note-detail-view-model"

describe("useNoteDetailViewModel", () => {
  it("entrega título e data formatada", async () => {
    const setup = createNotesTestSetup()
    const note = setup.notes.add(
      aNote({ title: "Comprar café", createdAt: "2026-03-10T12:00:00.000Z" }),
    )

    const { result } = await renderHook(() => useNoteDetailViewModel(note.id), {
      wrapper: setup.wrapper,
    })

    expect(result.current.state).toEqual({ status: "loading" })
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "ready",
        title: "Comprar café",
        createdAt: "10 mar 2026",
      }),
    )
  })

  it("traduz nota inexistente pelo code note.not_found", async () => {
    const setup = createNotesTestSetup()

    const { result } = await renderHook(() => useNoteDetailViewModel("nao-existe"), {
      wrapper: setup.wrapper,
    })

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "error",
        message: "Esta nota não existe mais.",
      }),
    )
  })
})
