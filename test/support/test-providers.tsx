import type { PropsWithChildren } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context"

import { ThemeProvider } from "@/shared/theme/context"
import { InMemoryKeyValueStorage } from "@test/support/in-memory-key-value-storage"

// Sem nativo, initialWindowMetrics é null e o provider não renderiza os filhos.
const TEST_WINDOW: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
}

// Um QueryClient por teste, sem retry (o teste vê o primeiro resultado) e com gcTime infinito
// (sem timers de coleta pendentes segurando o processo do Jest).
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
}

export interface TestProvidersProps {
  queryClient: QueryClient
}

// Os providers que o AppShell monta e que não são de nenhuma feature: gestos, safe area, tema e
// TanStack Query, sem persistência. Cada feature acrescenta o próprio provider por cima.
export function TestProviders({ queryClient, children }: PropsWithChildren<TestProvidersProps>) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={TEST_WINDOW}>
        <ThemeProvider storage={new InMemoryKeyValueStorage()}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
