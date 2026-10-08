import type { NotesRepository } from "@/features/notes/data/notes-repository"
import type { Note } from "@/features/notes/model/note"
import { offsetOf, type Page, type PageRequest } from "@/shared/pagination/page"

// Implementação de teste do contrato, no lugar de mocks. Preserva o comportamento relevante
// (identidade atribuída pela fonte, mais recentes primeiro, paginação) e ganha capacidades
// explícitas de teste: `add`, `all` e `failNextWith`.
export class FakeNotesRepository implements NotesRepository {
  private readonly notes = new Map<string, Note>()
  private pendingFailure: Error | null = null
  private sequence = 0

  async create(title: string): Promise<Note> {
    this.throwPendingFailure()
    this.sequence += 1
    return this.add({
      id: `fake-note-${this.sequence}`,
      title,
      // Instantes crescentes e determinísticos: a ordem "mais recente primeiro" fica estável.
      createdAt: new Date(Date.UTC(2026, 0, 1, 12, 0, this.sequence)).toISOString(),
    })
  }

  async findById(id: string): Promise<Note | null> {
    this.throwPendingFailure()
    return this.notes.get(id) ?? null
  }

  async list(request: PageRequest): Promise<Page<Note>> {
    this.throwPendingFailure()
    const ordered = this.all()
    const start = offsetOf(request)
    return { items: ordered.slice(start, start + request.size), total: ordered.length }
  }

  add(note: Note): Note {
    this.notes.set(note.id, note)
    return note
  }

  all(): Note[] {
    return [...this.notes.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  failNextWith(error: Error): void {
    this.pendingFailure = error
  }

  private throwPendingFailure(): void {
    if (this.pendingFailure !== null) {
      const failure = this.pendingFailure
      this.pendingFailure = null
      throw failure
    }
  }
}
