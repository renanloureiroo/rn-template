import type { Note } from "@/features/notes/model/note"

let sequence = 0

// Nota válida com o que o teste não especifica preenchido; cada chamada gera um id novo.
export function aNote(overrides: Partial<Note> = {}): Note {
  sequence += 1
  return {
    id: `note-${sequence}`,
    title: "Minha primeira nota",
    createdAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  }
}
