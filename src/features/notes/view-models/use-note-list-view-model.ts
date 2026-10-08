import { useInfiniteQuery } from "@tanstack/react-query"

import { noteListQuery } from "@/features/notes/data/notes-queries"
import type { Note } from "@/features/notes/model/note"
import { useNotesDependencies } from "@/features/notes/NotesProvider"
import { errorMessageOf } from "@/shared/errors/error-message"
import { formatDate } from "@/shared/utils/formatDate"

export interface NoteListItem {
  readonly id: string
  readonly title: string
  // Já formatada no idioma do usuário.
  readonly createdAt: string
}

// Um estado por situação da tela: a View só escolhe o que desenhar.
export type NoteListState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "empty" }
  | {
      readonly status: "ready"
      readonly notes: readonly NoteListItem[]
      readonly hasMore: boolean
      readonly isLoadingMore: boolean
    }

export interface NoteListViewModel {
  readonly state: NoteListState
  loadMore(): void
  refresh(): Promise<void>
  retry(): void
}

export function useNoteListViewModel(): NoteListViewModel {
  const { notesRepository } = useNotesDependencies()
  const query = useInfiniteQuery(noteListQuery(notesRepository))

  const notes = (query.data?.pages ?? []).flatMap((page) => page.items).map(toListItem)

  return {
    state: stateOf(),
    loadMore: () => {
      void query.fetchNextPage()
    },
    refresh: async () => {
      await query.refetch()
    },
    retry: () => {
      void query.refetch()
    },
  }

  // Com notas em mãos, uma falha de revalidação não apaga a lista: o usuário segue vendo o cache.
  function stateOf(): NoteListState {
    if (query.isPending) {
      return { status: "loading" }
    }
    if (notes.length > 0) {
      return {
        status: "ready",
        notes,
        hasMore: query.hasNextPage,
        isLoadingMore: query.isFetchingNextPage,
      }
    }
    if (query.isError) {
      return { status: "error", message: errorMessageOf(query.error) }
    }
    return { status: "empty" }
  }
}

function toListItem(note: Note): NoteListItem {
  return { id: note.id, title: note.title, createdAt: formatDate(note.createdAt) }
}
