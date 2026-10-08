import { act, renderHook, waitFor } from "@testing-library/react-native"

import { NOTES_PAGE_SIZE } from "@/features/notes/data/notes-queries"
import { aNote } from "@/features/notes/testing/note-fixtures"
import { createNotesTestSetup } from "@/features/notes/testing/notes-test-setup"
import { useNoteListViewModel } from "@/features/notes/view-models/use-note-list-view-model"
import { networkUnavailable } from "@/shared/http/http-errors"

describe("useNoteListViewModel", () => {
  async function renderViewModel(setup = createNotesTestSetup()) {
    const hook = await renderHook(() => useNoteListViewModel(), { wrapper: setup.wrapper })
    return { ...hook, ...setup }
  }

  it("começa carregando e fica vazio quando não há notas", async () => {
    const { result } = await renderViewModel()

    expect(result.current.state).toEqual({ status: "loading" })
    await waitFor(() => expect(result.current.state).toEqual({ status: "empty" }))
  })

  it("entrega as notas prontas para exibir, mais recentes primeiro", async () => {
    const setup = createNotesTestSetup()
    setup.notes.add(aNote({ id: "a", title: "Antiga", createdAt: "2026-03-09T12:00:00.000Z" }))
    setup.notes.add(aNote({ id: "b", title: "Nova", createdAt: "2026-03-10T12:00:00.000Z" }))

    const { result } = await renderViewModel(setup)

    await waitFor(() => expect(result.current.state.status).toBe("ready"))
    expect(result.current.state).toEqual({
      status: "ready",
      notes: [
        { id: "b", title: "Nova", createdAt: "10 mar 2026" },
        { id: "a", title: "Antiga", createdAt: "9 mar 2026" },
      ],
      hasMore: false,
      isLoadingMore: false,
    })
  })

  it("expõe a mensagem traduzida do erro e se recupera ao tentar de novo", async () => {
    const setup = createNotesTestSetup()
    setup.notes.failNextWith(networkUnavailable(new Error("offline")))
    setup.notes.add(aNote())
    const { result } = await renderViewModel(setup)

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "error",
        message: "Parece que você está sem conexão. Verifique a rede e tente de novo.",
      }),
    )
    await act(() => result.current.retry())

    await waitFor(() => expect(result.current.state.status).toBe("ready"))
  })

  it("pagina sob demanda até acabar", async () => {
    const setup = createNotesTestSetup()
    for (let index = 0; index <= NOTES_PAGE_SIZE; index++) {
      setup.notes.add(aNote({ createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() }))
    }
    const { result } = await renderViewModel(setup)
    await waitFor(() => expect(result.current.state).toMatchObject({ hasMore: true }))

    await act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.state).toMatchObject({ hasMore: false }))
    const state = result.current.state
    expect(state.status === "ready" && state.notes).toHaveLength(NOTES_PAGE_SIZE + 1)
  })

  it("mantém a lista em tela quando a revalidação falha", async () => {
    const setup = createNotesTestSetup()
    setup.notes.add(aNote({ title: "Em cache" }))
    const { result } = await renderViewModel(setup)
    await waitFor(() => expect(result.current.state.status).toBe("ready"))

    setup.notes.failNextWith(networkUnavailable(new Error("offline")))
    await act(() => result.current.refresh())

    expect(result.current.state).toMatchObject({
      status: "ready",
      notes: [expect.objectContaining({ title: "Em cache" })],
    })
  })
})
