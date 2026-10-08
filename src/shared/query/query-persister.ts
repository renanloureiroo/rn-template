import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import type { Persister } from "@tanstack/react-query-persist-client"

import type { KeyValueStorage } from "@/shared/storage/key-value-storage"

export const QUERY_CACHE_KEY = "query.cache"

// Persiste o cache do TanStack Query no MMKV: a última lista vista aparece imediatamente ao
// abrir o app, mesmo offline, e é revalidada em seguida.
export function createQueryPersister(storage: KeyValueStorage): Persister {
  return createSyncStoragePersister({
    key: QUERY_CACHE_KEY,
    throttleTime: 1_000,
    storage: {
      getItem: (key) => storage.getString(key),
      setItem: (key, value) => storage.setString(key, value),
      removeItem: (key) => storage.remove(key),
    },
  })
}
