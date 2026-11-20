export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface HttpRequest {
  readonly method: HttpMethod
  // Relativo à URL base, por exemplo `/notes/123`.
  readonly path: string
  readonly query?: Readonly<Record<string, string | number | undefined>>
  readonly body?: unknown
  // Somados aos do cliente; `Authorization` é sempre o da sessão quando há uma.
  readonly headers?: Readonly<Record<string, string>>
  // Quanto esperar pela resposta; sem ele, o padrão do cliente.
  readonly timeoutMs?: number
  // Cancela o pedido: a falha sai como `network.cancelled`.
  readonly signal?: AbortSignal
}

export interface HttpResponse<T> {
  readonly status: number
  readonly body: T
}

// Único caminho do app para falar HTTP: um contrato, com a implementação escolhida em
// `src/bootstrap`. Toda falha sai como AppError: HttpError quando o servidor respondeu com erro,
// `network.*` quando não houve resposta. Repositórios nunca veem `Response`, status solto ou
// exceção de rede crua.
export interface HttpClient {
  request<T>(request: HttpRequest): Promise<HttpResponse<T>>
}
