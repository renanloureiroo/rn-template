import { useQuery } from "@tanstack/react-query"

import { noteDetailQuery } from "@/features/notes/data/notes-queries"
import { useNotesDependencies } from "@/features/notes/NotesProvider"
import { errorMessageOf } from "@/shared/errors/error-message"
import { formatDate } from "@/shared/utils/formatDate"

export type NoteDetailState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly title: string; readonly createdAt: string }

export interface NoteDetailViewModel {
  readonly state: NoteDetailState
}

export function useNoteDetailViewModel(noteId: string): NoteDetailViewModel {
  const { notesRepository } = useNotesDependencies()
  const query = useQuery(noteDetailQuery(notesRepository, noteId))

  if (query.isPending) {
    return { state: { status: "loading" } }
  }
  if (query.isError) {
    // Nota inexistente chega com o code note.not_found e vira a mensagem traduzida.
    return { state: { status: "error", message: errorMessageOf(query.error) } }
  }
  return {
    state: {
      status: "ready",
      title: query.data.title,
      createdAt: formatDate(query.data.createdAt),
    },
  }
}
