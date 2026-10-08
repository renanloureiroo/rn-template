import { fireEvent, screen, waitFor } from "@testing-library/react-native"

import { NOTES_PAGE_SIZE } from "@/features/notes/data/notes-queries"
import { FakeNotesRepository } from "@/features/notes/testing/fake-notes-repository"
import { aNote } from "@/features/notes/testing/note-fixtures"
import { renderNotesScreen } from "@/features/notes/testing/notes-test-setup"
import { NoteListScreen } from "@/features/notes/views/NoteListScreen"
import { networkUnavailable } from "@/shared/http/http-errors"

describe("NoteListScreen", () => {
  let notes: FakeNotesRepository
  let opened: string[]
  let createRequests: number

  function renderList() {
    return renderNotesScreen(
      <NoteListScreen onOpenNote={(id) => opened.push(id)} onCreateNote={() => createRequests++} />,
      { notes },
    )
  }

  beforeEach(() => {
    notes = new FakeNotesRepository()
    opened = []
    createRequests = 0
  })

  it("lista as notas com a data de criação formatada", async () => {
    notes.add(aNote({ title: "Comprar café", createdAt: "2026-03-10T12:00:00.000Z" }))

    await renderList()

    expect(await screen.findByText("Comprar café")).toBeOnTheScreen()
    expect(screen.getByText("Criada em 10 mar 2026")).toBeOnTheScreen()
  })

  it("avisa a navegação ao tocar em uma nota", async () => {
    const note = notes.add(aNote())
    await renderList()

    await fireEvent.press(await screen.findByTestId(`note-${note.id}`))

    expect(opened).toEqual([note.id])
  })

  it("mostra o estado vazio com a ação de criar", async () => {
    await renderList()

    expect(await screen.findByText("Nenhuma nota ainda")).toBeOnTheScreen()
    await fireEvent.press(screen.getByText("Nova nota"))
    expect(createRequests).toBe(1)
  })

  it("carrega a próxima página sob demanda", async () => {
    for (let index = 0; index <= NOTES_PAGE_SIZE; index++) {
      notes.add(
        aNote({
          title: `Nota ${index}`,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        }),
      )
    }
    await renderList()
    expect(await screen.findByText(`Nota ${NOTES_PAGE_SIZE}`)).toBeOnTheScreen()
    expect(screen.queryByText("Nota 0")).toBeNull()

    await fireEvent.press(screen.getByText("Carregar mais"))

    expect(await screen.findByText("Nota 0")).toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByText("Carregar mais")).toBeNull())
  })

  it("mostra a mensagem do erro e tenta de novo", async () => {
    notes.failNextWith(networkUnavailable(new Error("offline")))
    notes.add(aNote({ title: "Depois da rede voltar" }))
    await renderList()

    expect(
      await screen.findByText(
        "Parece que você está sem conexão. Verifique a rede e tente de novo.",
      ),
    ).toBeOnTheScreen()
    await fireEvent.press(screen.getByText("Tentar de novo"))

    expect(await screen.findByText("Depois da rede voltar")).toBeOnTheScreen()
  })
})
