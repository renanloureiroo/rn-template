import { useMemo } from "react"
import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin"
import { createMMKVStorageAdapter, useRozeniteStoragePlugin } from "@rozenite/storage-plugin"
import { useTanStackQueryDevTools } from "@rozenite/tanstack-query-plugin"
import { useQueryClient } from "@tanstack/react-query"

import type { KeyValueStorage } from "@/shared/storage/key-value-storage"
import { MmkvKeyValueStorage } from "@/shared/storage/mmkv-key-value-storage"

export interface DevToolsProps {
  storage: KeyValueStorage
}

/**
 * Painéis do React Native DevTools (Rozenite) para o que o app usa: cache do TanStack Query,
 * conteúdo do MMKV e requisições de rede. Abra com `j` no terminal do `expo start`.
 *
 * Os hooks dos plugins viram no-op em produção, e o Metro só carrega o Rozenite no servidor de
 * desenvolvimento (ver metro.config.js). O plugin de navegação fica em cada variante.
 */
export function DevTools({ storage }: DevToolsProps) {
  const queryClient = useQueryClient()

  const storages = useMemo(
    () =>
      storage instanceof MmkvKeyValueStorage
        ? [createMMKVStorageAdapter({ storages: { app: storage.mmkv } })]
        : [],
    [storage],
  )

  useTanStackQueryDevTools(queryClient)
  useRozeniteStoragePlugin({ storages })
  useNetworkActivityDevTools()

  return null
}
