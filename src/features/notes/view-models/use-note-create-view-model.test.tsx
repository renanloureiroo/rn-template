import { act, renderHook, waitFor } from "@testing-library/react-native"

import { noteKeys } from "@/features/notes/data/notes-queries"
import { createNoteDraftStore } from "@/features/notes/stores/note-draft-store"
import { createNotesTestSetup } from "@/features/notes/testing/notes-test-setup"
import { useNoteCreateViewModel } from "@/features/notes/view-models/use-note-create-view-model"
import { networkUnavailable } from "@/shared/http/http-errors"

describe("useNoteCreateViewModel", () => {
  let created: string[]

  async function renderViewModel(setup = createNotesTestSetup()) {
    const hook = await renderHook(
      () => useNoteCreateViewModel({ onCreated: (id) => created.push(id) }),
      { wrapper: setup.wrapper },
    )
    return { ...hook, ...setup }
  }

  beforeEach(() => {
    created = []
  })

  it("parte do rascunho guardado e expõe o limite do título", async () => {
    const { result } = await renderViewModel(
      createNotesTestSetup({ draft: createNoteDraftStore({ title: "Rascunho" }) }),
    )

    expect(result.current).toMatchObject({
      title: "Rascunho",
      maxLength: 120,
      errorMessage: undefined,
      isSaving: false,
    })
  })

  it("cria a nota, semeia o detalhe no cache, limpa o rascunho e emite o id", async () => {
    const { result, notes, draft, queryClient } = await renderViewModel()

    await act(() => result.current.changeTitle("Comprar café"))
    await act(() => result.current.submit())

    await waitFor(() => expect(created).toHaveLength(1))
    const [saved] = notes.all()
    expect(created).toEqual([saved?.id])
    expect(queryClient.getQueryData(noteKeys.detail(saved?.id ?? ""))).toEqual(saved)
    expect(draft.getState().title).toBe("")
  })

  it("recusa título inválido antes de chegar ao repositório", async () => {
    const { result, notes } = await renderViewModel()

    await act(() => result.current.changeTitle("   "))
    await act(() => result.current.submit())

    await waitFor(() =>
      expect(result.current.errorMessage).toBe(
        "O título é obrigatório e pode ter no máximo 120 caracteres.",
      ),
    )
    expect(notes.all()).toEqual([])
    expect(created).toEqual([])
  })

  it("mostra a falha da fonte, mantém o rascunho e limpa o erro ao voltar a digitar", async () => {
    const { result, notes, draft } = await renderViewModel()
    notes.failNextWith(networkUnavailable(new Error("offline")))

    await act(() => result.current.changeTitle("Comprar café"))
    await act(() => result.current.submit())
    await waitFor(() => expect(result.current.errorMessage).toBeDefined())
    expect(draft.getState().title).toBe("Comprar café")

    await act(() => result.current.changeTitle("Comprar café e pão"))

    await waitFor(() => expect(result.current.errorMessage).toBeUndefined())
  })
})
