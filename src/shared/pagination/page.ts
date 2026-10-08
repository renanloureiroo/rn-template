// Formato de página do backend (`{ items, total }`). Objetos simples: páginas vão para o cache
// persistido do TanStack Query, que é gravado em JSON.
export interface PageRequest {
  readonly page: number
  readonly size: number
}

export interface Page<T> {
  readonly items: readonly T[]
  readonly total: number
}

export function offsetOf(request: PageRequest): number {
  return request.page * request.size
}

export function hasNextPage(page: Page<unknown>, request: PageRequest): boolean {
  return offsetOf(request) + request.size < page.total
}
