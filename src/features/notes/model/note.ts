import { AppError, ErrorType } from "@/shared/errors/app-error"

// Modelo da feature: dado simples e serializável (vai para o cache persistido do TanStack Query).
// Quem atribui `id` e `createdAt` é a fonte de dados, a API ou o armazenamento local.
export interface Note {
  readonly id: string
  readonly title: string
  // ISO 8601.
  readonly createdAt: string
}

// Mesma invariante do backend: o app valida antes de ir à rede e o formulário usa o limite.
export const NOTE_TITLE_MAX_LENGTH = 120

export const NoteErrorCode = {
  TITLE_INVALID: "note.title_invalid",
  NOT_FOUND: "note.not_found",
} as const

// Regra de negócio fica no modelo, em função pura: a ViewModel chama e o teste prova sem React.
export function validateNoteTitle(title: string): string {
  if (title.trim() === "" || title.length > NOTE_TITLE_MAX_LENGTH) {
    throw new AppError(
      ErrorType.VALIDATION,
      NoteErrorCode.TITLE_INVALID,
      `Título é obrigatório e pode ter até ${NOTE_TITLE_MAX_LENGTH} caracteres`,
    )
  }
  return title
}

export function noteNotFound(id: string): AppError {
  return new AppError(ErrorType.NOT_FOUND, NoteErrorCode.NOT_FOUND, `Nota não encontrada: ${id}`)
}
