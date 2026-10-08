import { QueryClient } from "@tanstack/react-query"

import { AppError, ErrorType } from "@/shared/errors/app-error"

// O cache persistido não pode expirar da memória antes de expirar do disco.
export const QUERY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: QUERY_CACHE_MAX_AGE_MS,
        retry: shouldRetry,
      },
      mutations: { retry: false },
    },
  })
}

// Só vale repetir quando a fonte não respondeu. Erro com `code` (404, validação, regra de
// negócio) é resposta definitiva: repetir só atrasa a mensagem para o usuário.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return error instanceof AppError && error.type === ErrorType.UNAVAILABLE && failureCount < 2
}
