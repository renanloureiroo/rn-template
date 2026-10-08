import { AppError, ErrorType } from "@/shared/errors/app-error"

// Corpo RFC 9457 publicado pelos backends (nestjs/spring-boot-hexagonal-template).
export interface ProblemDetail {
  readonly type?: string
  readonly title?: string
  readonly status?: number
  readonly detail?: string
  readonly instance?: string
  readonly code?: string
  readonly traceId?: string
  readonly errors?: Readonly<Record<string, string>>
}

const TYPE_BY_STATUS: Readonly<Record<number, ErrorType>> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.UNAUTHORIZED,
  403: ErrorType.FORBIDDEN,
  404: ErrorType.NOT_FOUND,
  409: ErrorType.CONFLICT,
  422: ErrorType.BUSINESS_RULE,
  502: ErrorType.UNAVAILABLE,
  503: ErrorType.UNAVAILABLE,
  504: ErrorType.UNAVAILABLE,
}

// Códigos reservados pela borda HTTP do backend, usados quando o corpo não traz `code`.
const FALLBACK_CODE_BY_STATUS: Readonly<Record<number, string>> = {
  400: "request.invalid",
  404: "request.not_found",
}

export const HttpErrorCode = {
  UNEXPECTED: "internal.unexpected",
  NETWORK_UNAVAILABLE: "network.unavailable",
  NETWORK_TIMEOUT: "network.timeout",
} as const

// O servidor respondeu com erro. O status vira ErrorType e o `code` do corpo é preservado, então
// a tela trata o mesmo contrato que o servidor publica.
export class HttpError extends AppError {
  readonly status: number
  readonly traceId: string | null

  private constructor(
    type: ErrorType,
    code: string,
    message: string,
    status: number,
    traceId?: string,
  ) {
    super(type, code, message)
    this.status = status
    this.traceId = traceId ?? null
  }

  static fromResponse(status: number, body: unknown): HttpError {
    const problem = isProblemDetail(body) ? body : {}
    const type = TYPE_BY_STATUS[status] ?? ErrorType.UNEXPECTED
    const code = problem.code ?? FALLBACK_CODE_BY_STATUS[status] ?? HttpErrorCode.UNEXPECTED
    const message = problem.detail ?? problem.title ?? `Resposta HTTP ${status}`
    return new HttpError(type, code, message, status, problem.traceId)
  }
}

// A requisição não obteve resposta: sem conexão, DNS, TLS ou timeout.
export function networkUnavailable(cause: unknown): AppError {
  const message = "Servidor indisponível"
  return new AppError(ErrorType.UNAVAILABLE, HttpErrorCode.NETWORK_UNAVAILABLE, message, { cause })
}

export function networkTimeout(timeoutMs: number): AppError {
  return new AppError(
    ErrorType.UNAVAILABLE,
    HttpErrorCode.NETWORK_TIMEOUT,
    `Servidor não respondeu em ${timeoutMs} ms`,
  )
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === "object" && body !== null && !Array.isArray(body)
}
