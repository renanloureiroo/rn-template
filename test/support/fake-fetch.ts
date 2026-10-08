import type { FetchFn } from "@/shared/http/http-client"

export interface RecordedRequest {
  readonly url: string
  readonly method: string
  readonly headers: Record<string, string>
  readonly body: unknown
}

type Scripted =
  | { kind: "response"; status: number; body?: unknown; contentType: string }
  | { kind: "failure"; error: Error }
  | { kind: "hang" }

// Fetch roteirizado para testar o HttpClient e os repositórios remotos sem servidor e sem mock
// global: cada chamada consome a próxima resposta da fila e fica registrada em `requests`.
export class FakeFetch {
  readonly requests: RecordedRequest[] = []
  private readonly script: Scripted[] = []

  readonly fetch: FetchFn = async (url, init) => {
    this.requests.push({
      url,
      method: init.method ?? "GET",
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    })
    const next = this.script.shift()
    if (next === undefined) {
      throw new Error(`FakeFetch sem resposta roteirizada para ${init.method} ${url}`)
    }
    if (next.kind === "failure") {
      throw next.error
    }
    if (next.kind === "hang") {
      return new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")))
      })
    }
    const text = next.body === undefined ? "" : JSON.stringify(next.body)
    return new Response(text === "" ? null : text, {
      status: next.status,
      headers: { "Content-Type": next.contentType },
    })
  }

  respondWith(status: number, body?: unknown): this {
    this.script.push({ kind: "response", status, body, contentType: "application/json" })
    return this
  }

  respondWithProblem(status: number, problem: Record<string, unknown>): this {
    this.script.push({
      kind: "response",
      status,
      body: { status, ...problem },
      contentType: "application/problem+json",
    })
    return this
  }

  failWith(error: Error): this {
    this.script.push({ kind: "failure", error })
    return this
  }

  hang(): this {
    this.script.push({ kind: "hang" })
    return this
  }

  lastRequest(): RecordedRequest {
    const last = this.requests.at(-1)
    if (last === undefined) {
      throw new Error("Nenhuma requisição foi feita")
    }
    return last
  }
}
