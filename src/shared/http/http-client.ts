import { HttpError, networkTimeout, networkUnavailable } from "@/shared/http/http-errors"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface HttpRequest {
  readonly method: HttpMethod
  // Relativo à URL base, por exemplo `/notes/123`.
  readonly path: string
  readonly query?: Readonly<Record<string, string | number | undefined>>
  readonly body?: unknown
}

export interface HttpResponse<T> {
  readonly status: number
  readonly body: T
}

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>

export interface HttpClientOptions {
  readonly baseUrl: string
  readonly timeoutMs?: number
  // Injetável para que o teste use um fetch fake, sem mock global.
  readonly fetch?: FetchFn
}

// Único lugar do app que fala HTTP. Toda falha sai como AppError: HttpError quando o servidor
// respondeu com erro, `network.*` quando não houve resposta. Repositórios nunca veem `Response`,
// status solto ou exceção de rede crua.
export class HttpClient {
  static readonly DEFAULT_TIMEOUT_MS = 15_000

  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: FetchFn

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "")
    this.timeoutMs = options.timeoutMs ?? HttpClient.DEFAULT_TIMEOUT_MS
    this.fetchFn = options.fetch ?? ((url, init) => fetch(url, init))
  }

  async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const response = await this.send(request)
    const body = await bodyOf(response)
    if (!response.ok) {
      throw HttpError.fromResponse(response.status, body)
    }
    return { status: response.status, body: body as T }
  }

  private async send(request: HttpRequest): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await this.fetchFn(this.urlOf(request), {
        method: request.method,
        headers: headersOf(request),
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      })
    } catch (error) {
      throw controller.signal.aborted ? networkTimeout(this.timeoutMs) : networkUnavailable(error)
    } finally {
      clearTimeout(timer)
    }
  }

  private urlOf({ path, query }: HttpRequest): string {
    const search = Object.entries(query ?? {})
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&")
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${this.baseUrl}${normalizedPath}${search === "" ? "" : `?${search}`}`
  }
}

function headersOf(request: HttpRequest): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json, application/problem+json" }
  if (request.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  return headers
}

// Corpo vazio ou ilegível vira `undefined`; quem decide se isso é erro é o status.
async function bodyOf(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === "") {
    return undefined
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}
