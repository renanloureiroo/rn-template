import { AccessTokenGate, type AccessTokenGateOptions } from "@/shared/http/access-token-gate"
import type { HttpClient, HttpRequest, HttpResponse } from "@/shared/http/http-client"
import {
  HttpError,
  networkCancelled,
  networkTimeout,
  networkUnavailable,
} from "@/shared/http/http-errors"

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>

export interface FetchHttpClientOptions {
  readonly baseUrl: string
  readonly timeoutMs?: number
  // Injetável para que o teste use um fetch fake, sem mock global.
  readonly fetch?: FetchFn
  // Sessão do app: o token vai no `Authorization` e o 401 renova e refaz o pedido uma vez.
  // Sem ela, o cliente é anônimo.
  readonly session?: AccessTokenGateOptions
}

const UNAUTHORIZED = 401

// HttpClient sobre o `fetch` da plataforma. Com sessão, um semáforo garante uma renovação só
// quando vários pedidos recebem 401 ao mesmo tempo.
export class FetchHttpClient implements HttpClient {
  static readonly DEFAULT_TIMEOUT_MS = 15_000

  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchFn: FetchFn
  private readonly gate: AccessTokenGate | null

  constructor(options: FetchHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "")
    this.timeoutMs = options.timeoutMs ?? FetchHttpClient.DEFAULT_TIMEOUT_MS
    this.fetchFn = options.fetch ?? ((url, init) => fetch(url, init))
    this.gate = options.session === undefined ? null : new AccessTokenGate(options.session)
  }

  async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const issued = this.gate === null ? null : await this.gate.acquire()
    const response = await this.send(request, issued?.token ?? null)
    if (response.status === UNAUTHORIZED && this.gate !== null && issued !== null) {
      const retried = await this.gate.retry(issued, (token) => this.send(request, token))
      return this.parsed<T>(retried ?? response)
    }
    return this.parsed<T>(response)
  }

  private async parsed<T>(response: Response): Promise<HttpResponse<T>> {
    const body = await bodyOf(response)
    if (!response.ok) {
      throw HttpError.fromResponse(response.status, body)
    }
    return { status: response.status, body: body as T }
  }

  private async send(request: HttpRequest, token: string | null): Promise<Response> {
    const timeoutMs = request.timeoutMs ?? this.timeoutMs
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const cancel = () => controller.abort()
    request.signal?.addEventListener("abort", cancel)
    try {
      if (request.signal?.aborted) {
        throw networkCancelled()
      }
      return await this.fetchFn(this.urlOf(request), {
        method: request.method,
        headers: headersOf(request, token),
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      })
    } catch (error) {
      if (request.signal?.aborted) {
        throw networkCancelled()
      }
      throw controller.signal.aborted ? networkTimeout(timeoutMs) : networkUnavailable(error)
    } finally {
      clearTimeout(timer)
      request.signal?.removeEventListener("abort", cancel)
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

function headersOf(request: HttpRequest, token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json, application/problem+json",
    ...request.headers,
  }
  if (request.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`
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
