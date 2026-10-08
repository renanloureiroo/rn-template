import { PropsWithChildren, useEffect, useState } from "react"
import type { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { createQueryClient, QUERY_CACHE_MAX_AGE_MS } from "@/shared/query/query-client"
import { createQueryPersister } from "@/shared/query/query-persister"
import { connectQueryManagers } from "@/shared/query/react-native-query-managers"
import type { KeyValueStorage } from "@/shared/storage/key-value-storage"

// Troque quando o formato de um dado em cache mudar (um campo novo em Note, por exemplo): o cache
// gravado no formato antigo é descartado no próximo boot em vez de chegar à tela.
const QUERY_CACHE_BUSTER = "2"

export interface QueryProviderProps {
  storage: KeyValueStorage
  // Em teste, um QueryClient próprio por teste (ver test/support/test-providers.tsx).
  client?: QueryClient
}

// Estado do servidor: TanStack Query com cache persistido no armazenamento do dispositivo. Só
// queries com sucesso são gravadas (padrão do TanStack).
export function QueryProvider({
  storage,
  client,
  children,
}: PropsWithChildren<QueryProviderProps>) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  const [persister] = useState(() => createQueryPersister(storage))

  useEffect(() => connectQueryManagers(), [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: QUERY_CACHE_MAX_AGE_MS, buster: QUERY_CACHE_BUSTER }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
