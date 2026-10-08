import { createContext, type PropsWithChildren, useContext } from "react"

import type { NotesRepository } from "@/features/notes/data/notes-repository"
import {
  type NoteDraftStore,
  NoteDraftStoreProvider,
} from "@/features/notes/stores/note-draft-store"

// O que a feature precisa de fora. Só contratos: quem escolhe a implementação é a raiz de
// composição (src/bootstrap/app-dependencies.ts) e, nos testes, o próprio teste.
export interface NotesDependencies {
  readonly notesRepository: NotesRepository
}

const NotesDependenciesContext = createContext<NotesDependencies | null>(null)

export interface NotesProviderProps {
  dependencies: NotesDependencies
  // Em teste, uma store criada pelo próprio teste para afirmar o estado depois da interação.
  draftStore?: NoteDraftStore
}

// Montado uma vez acima de todas as telas da feature.
export function NotesProvider({
  dependencies,
  draftStore,
  children,
}: PropsWithChildren<NotesProviderProps>) {
  return (
    <NotesDependenciesContext.Provider value={dependencies}>
      <NoteDraftStoreProvider store={draftStore}>{children}</NoteDraftStoreProvider>
    </NotesDependenciesContext.Provider>
  )
}

export function useNotesDependencies(): NotesDependencies {
  const dependencies = useContext(NotesDependenciesContext)
  if (dependencies === null) {
    throw new Error("useNotesDependencies precisa estar dentro de um NotesProvider")
  }
  return dependencies
}
