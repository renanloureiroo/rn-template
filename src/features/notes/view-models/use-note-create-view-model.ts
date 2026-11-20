import { useMutation, useQueryClient } from "@tanstack/react-query"

import { noteKeys } from "@/features/notes/data/notes-queries"
import { type Note, NOTE_TITLE_MAX_LENGTH, validateNoteTitle } from "@/features/notes/model/note"
import { useNotesDependencies } from "@/features/notes/NotesProvider"
import { useNoteDraftActions, useNoteDraftTitle } from "@/features/notes/stores/note-draft-store"
import { errorMessageOf } from "@/shared/errors/error-message"
import { haptics } from "@/shared/haptics/haptics"
import { translate } from "@/shared/i18n/translate"
import { useSnackbar } from "@/shared/snackbar/snackbar-queue"

export interface NoteCreateViewModel {
  readonly title: string
  readonly maxLength: number
  // Mensagem traduzida do último erro; some quando o usuário volta a digitar.
  readonly errorMessage: string | undefined
  readonly isSaving: boolean
  changeTitle(title: string): void
  submit(): void
}

export interface NoteCreateViewModelOptions {
  // Evento de saída: a ViewModel não sabe para onde o app navega depois de criar.
  onCreated: (noteId: string) => void
}

export function useNoteCreateViewModel({
  onCreated,
}: NoteCreateViewModelOptions): NoteCreateViewModel {
  const { notesRepository } = useNotesDependencies()
  const queryClient = useQueryClient()
  const title = useNoteDraftTitle()
  const draft = useNoteDraftActions()
  const snackbar = useSnackbar()

  const createNote = useMutation({
    // A regra do modelo roda antes de qualquer I/O: título inválido não chega ao repositório.
    mutationFn: (input: string) => notesRepository.create(validateNoteTitle(input)),
    onSuccess: async (created) => {
      // O detalhe da nota recém-criada já é conhecido: a próxima tela abre sem nova busca.
      queryClient.setQueryData<Note>(noteKeys.detail(created.id), created)
      await queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
    // O que a pessoa mandou não foi aceito: ela sente, além de ler a mensagem.
    onError: () => haptics().play("error"),
  })

  return {
    title,
    maxLength: NOTE_TITLE_MAX_LENGTH,
    errorMessage: createNote.isError ? errorMessageOf(createNote.error) : undefined,
    isSaving: createNote.isPending,
    changeTitle: (next) => {
      draft.changeTitle(next)
      createNote.reset()
    },
    submit: () => {
      createNote.mutate(title, {
        onSuccess: (created) => {
          snackbar.show({ text: translate("notes:created") })
          draft.clear()
          onCreated(created.id)
        },
      })
    },
  }
}
