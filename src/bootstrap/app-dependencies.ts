import { type Environment, loadEnvironment, NotesDataSource } from "@/bootstrap/environment"
import { LocalNotesRepository } from "@/features/notes/data/local-notes-repository"
import { RemoteNotesRepository } from "@/features/notes/data/remote-notes-repository"
import type { NotesDependencies } from "@/features/notes/NotesProvider"
import { ExpoHaptics } from "@/shared/haptics/expo-haptics"
import { type Haptics, provideHaptics } from "@/shared/haptics/haptics"
import { FetchHttpClient } from "@/shared/http/fetch-http-client"
import type { KeyValueStorage } from "@/shared/storage/key-value-storage"
import { MmkvKeyValueStorage } from "@/shared/storage/mmkv-key-value-storage"

// Tudo que o app precisa de fora, agrupado por quem consome. Só contratos: as implementações são
// escolhidas abaixo, e os testes montam o mesmo formato com fakes.
export interface AppDependencies {
  readonly storage: KeyValueStorage
  readonly notes: NotesDependencies
}

// Raiz de composição: o único lugar que cria implementações e decide qual delas roda. Trocar a
// API pelo armazenamento local (ou por qualquer outra implementação) é uma mudança só aqui.
export function createAppDependencies(
  environment: Environment = loadEnvironment(),
  storage: KeyValueStorage = new MmkvKeyValueStorage(),
  haptics: Haptics = new ExpoHaptics(),
): AppDependencies {
  // Serviços transversais sem estado de tela: a ViewModel lê pelo módulo (`haptics()`), e o teste
  // liga um fake pelo mesmo provide.
  provideHaptics(haptics)
  const http = new FetchHttpClient({ baseUrl: environment.apiUrl })

  return {
    storage,
    notes: {
      notesRepository:
        environment.notesDataSource === NotesDataSource.REMOTE
          ? new RemoteNotesRepository(http)
          : new LocalNotesRepository(storage),
    },
  }
}
