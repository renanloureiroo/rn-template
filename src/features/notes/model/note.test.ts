import { NOTE_TITLE_MAX_LENGTH, noteNotFound, validateNoteTitle } from "@/features/notes/model/note"
import { AppError, ErrorType } from "@/shared/errors/app-error"
import { captureError } from "@test/support/capture-error"

describe("validateNoteTitle", () => {
  it.each(["Comprar café", "a", "x".repeat(NOTE_TITLE_MAX_LENGTH)])("aceita %p", (title) => {
    expect(validateNoteTitle(title)).toBe(title)
  })

  it.each(["", "   ", "x".repeat(NOTE_TITLE_MAX_LENGTH + 1)])("recusa %p", (title) => {
    const error = captureError(() => validateNoteTitle(title))

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: "note.title_invalid" })
  })
})

describe("noteNotFound", () => {
  it("carrega o code que a tela traduz", () => {
    expect(noteNotFound("123")).toMatchObject({
      type: ErrorType.NOT_FOUND,
      code: "note.not_found",
    })
  })
})
