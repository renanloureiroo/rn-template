import { createNoteDraftStore } from "@/features/notes/stores/note-draft-store"

describe("NoteDraftStore", () => {
  it("nasce vazio ou com o título inicial", () => {
    expect(createNoteDraftStore().getState().title).toBe("")
    expect(createNoteDraftStore({ title: "Rascunho" }).getState().title).toBe("Rascunho")
  })

  it("altera e limpa o título pelas ações", () => {
    const sut = createNoteDraftStore()

    sut.getState().actions.changeTitle("Comprar café")
    expect(sut.getState().title).toBe("Comprar café")

    sut.getState().actions.clear()
    expect(sut.getState().title).toBe("")
  })

  it("mantém a mesma referência de ações entre mudanças de estado", () => {
    const sut = createNoteDraftStore()
    const actions = sut.getState().actions

    sut.getState().actions.changeTitle("Outro")

    expect(sut.getState().actions).toBe(actions)
  })

  it("isola cada instância", () => {
    const first = createNoteDraftStore()
    const second = createNoteDraftStore()

    first.getState().actions.changeTitle("Só na primeira")

    expect(second.getState().title).toBe("")
  })
})
