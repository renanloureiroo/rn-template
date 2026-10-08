import type { NotesRepository } from "@/features/notes/data/notes-repository"
import type { Note } from "@/features/notes/model/note"
import { AppError, ErrorType } from "@/shared/errors/app-error"
import type { HttpClient } from "@/shared/http/http-client"
import { HttpErrorCode } from "@/shared/http/http-errors"
import type { Page, PageRequest } from "@/shared/pagination/page"

// Contrato da API de notas dos backends (NoteResponseDTO do nestjs-hexagonal-template).
interface NoteResponse {
  readonly id: string
  readonly title: string
  readonly createdAt: string
}

interface NotePageResponse {
  readonly items: readonly NoteResponse[]
  readonly total: number
}

// Implementação sobre a API: POST /notes, GET /notes/:id e GET /notes paginado.
export class RemoteNotesRepository implements NotesRepository {
  constructor(private readonly http: HttpClient) {}

  async create(title: string): Promise<Note> {
    const response = await this.http.request<NoteResponse>({
      method: "POST",
      path: "/notes",
      body: { title },
    })
    return toNote(response.body)
  }

  async findById(id: string): Promise<Note | null> {
    try {
      const response = await this.http.request<NoteResponse>({
        method: "GET",
        path: `/notes/${encodeURIComponent(id)}`,
      })
      return toNote(response.body)
    } catch (error) {
      // O contrato expressa ausência como `null`; o 404 do servidor é detalhe do protocolo.
      if (error instanceof AppError && error.type === ErrorType.NOT_FOUND) {
        return null
      }
      throw error
    }
  }

  async list(request: PageRequest): Promise<Page<Note>> {
    const response = await this.http.request<NotePageResponse>({
      method: "GET",
      path: "/notes",
      query: { page: request.page, size: request.size },
    })
    return { items: response.body.items.map(toNote), total: response.body.total }
  }
}

// Uma resposta fora do contrato falha aqui, com erro inesperado, e não espalhada pela tela.
function toNote(response: NoteResponse): Note {
  const valid =
    typeof response?.id === "string" &&
    response.id !== "" &&
    typeof response.title === "string" &&
    typeof response.createdAt === "string" &&
    !Number.isNaN(Date.parse(response.createdAt))
  if (!valid) {
    throw new AppError(ErrorType.UNEXPECTED, HttpErrorCode.UNEXPECTED, "Nota fora do contrato")
  }
  return { id: response.id, title: response.title, createdAt: response.createdAt }
}
