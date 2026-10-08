import type { PropsWithChildren, ReactElement } from "react"
import { render } from "@testing-library/react-native"

import { NotesProvider } from "@/features/notes/NotesProvider"
import { createNoteDraftStore, type NoteDraftStore } from "@/features/notes/stores/note-draft-store"
import { FakeNotesRepository } from "@/features/notes/testing/fake-notes-repository"
import { createTestQueryClient, TestProviders } from "@test/support/test-providers"

export interface NotesTestOptions {
  notes?: FakeNotesRepository
  draft?: NoteDraftStore
}

// Monta a feature como em produção, com as implementações reais trocadas por fakes. Devolve os
// fakes para o teste semear dados antes e afirmar o estado depois.
export function createNotesTestSetup(options: NotesTestOptions = {}) {
  const notes = options.notes ?? new FakeNotesRepository()
  const draft = options.draft ?? createNoteDraftStore()
  const queryClient = createTestQueryClient()

  function wrapper({ children }: PropsWithChildren) {
    return (
      <TestProviders queryClient={queryClient}>
        <NotesProvider dependencies={{ notesRepository: notes }} draftStore={draft}>
          {children}
        </NotesProvider>
      </TestProviders>
    )
  }

  return { notes, draft, queryClient, wrapper }
}

// Para testes de View: renderiza a tela dentro da feature montada com fakes.
export async function renderNotesScreen(ui: ReactElement, options: NotesTestOptions = {}) {
  const setup = createNotesTestSetup(options)
  const result = await render(ui, { wrapper: setup.wrapper })
  return { ...result, ...setup }
}
