import type { Note } from "@/features/notes/model/note"
import type { Page, PageRequest } from "@/shared/pagination/page"

// Contrato que as ViewModels conhecem. Implementações: RemoteNotesRepository (API),
// LocalNotesRepository (dispositivo) e FakeNotesRepository (testes). Qual delas roda é decidido
// só em src/bootstrap/app-dependencies.ts.
export interface NotesRepository {
  // A fonte de dados cria a nota e devolve identidade e instante de criação.
  create(title: string): Promise<Note>

  // Ausência é `null` explícito; `undefined` nunca sai de um repositório.
  findById(id: string): Promise<Note | null>

  // Mais recentes primeiro.
  list(request: PageRequest): Promise<Page<Note>>
}
