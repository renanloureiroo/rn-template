import { randomUUID } from "expo-crypto"

import type { NotesRepository } from "@/features/notes/data/notes-repository"
import type { Note } from "@/features/notes/model/note"
import { offsetOf, type Page, type PageRequest } from "@/shared/pagination/page"
import type { KeyValueStorage } from "@/shared/storage/key-value-storage"

export interface LocalNotesRepositoryOptions {
  readonly newId?: () => string
  readonly now?: () => Date
}

// Implementação no dispositivo, sem backend. Faz o papel que o servidor faria na API: atribui
// identidade e instante de criação. Gerador de id e relógio são injetáveis para o teste.
export class LocalNotesRepository implements NotesRepository {
  static readonly KEY = "notes.items"

  private readonly newId: () => string
  private readonly now: () => Date

  constructor(
    private readonly storage: KeyValueStorage,
    options: LocalNotesRepositoryOptions = {},
  ) {
    this.newId = options.newId ?? randomUUID
    this.now = options.now ?? (() => new Date())
  }

  async create(title: string): Promise<Note> {
    const note: Note = { id: this.newId(), title, createdAt: this.now().toISOString() }
    this.write([note, ...this.read()])
    return note
  }

  async findById(id: string): Promise<Note | null> {
    return this.read().find((note) => note.id === id) ?? null
  }

  async list(request: PageRequest): Promise<Page<Note>> {
    const notes = [...this.read()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const start = offsetOf(request)
    return { items: notes.slice(start, start + request.size), total: notes.length }
  }

  private read(): Note[] {
    const raw = this.storage.getString(LocalNotesRepository.KEY)
    return raw === null ? [] : (JSON.parse(raw) as Note[])
  }

  private write(notes: readonly Note[]): void {
    this.storage.setString(LocalNotesRepository.KEY, JSON.stringify(notes))
  }
}
