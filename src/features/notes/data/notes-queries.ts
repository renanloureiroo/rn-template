import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"

import type { NotesRepository } from "@/features/notes/data/notes-repository"
import { noteNotFound } from "@/features/notes/model/note"
import { hasNextPage } from "@/shared/pagination/page"

export const NOTES_PAGE_SIZE = 20

// Chaves hierárquicas: invalidar `noteKeys.all` alcança listas e detalhes.
export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
}

// Chave e busca ficam juntas e tipadas (padrão `queryOptions` do TanStack). O repositório entra
// por parâmetro: as ViewModels passam o que receberam do NotesProvider.

export function noteListQuery(repository: NotesRepository) {
  return infiniteQueryOptions({
    queryKey: noteKeys.lists(),
    queryFn: ({ pageParam }) => repository.list({ page: pageParam, size: NOTES_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      hasNextPage(lastPage, { page: lastPageParam, size: NOTES_PAGE_SIZE })
        ? lastPageParam + 1
        : undefined,
  })
}

export function noteDetailQuery(repository: NotesRepository, id: string) {
  return queryOptions({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const note = await repository.findById(id)
      if (note === null) {
        throw noteNotFound(id)
      }
      return note
    },
  })
}
