// Famílias de erro. As seis primeiras espelham o backend; as duas últimas só o cliente observa:
// - UNAVAILABLE: a fonte de dados não respondeu (sem rede, timeout, 502/503/504);
// - UNEXPECTED: a fonte respondeu algo que o app não sabe tratar (500, corpo ilegível).
export const ErrorType = {
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION: "VALIDATION",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  BUSINESS_RULE: "BUSINESS_RULE",
  UNAVAILABLE: "UNAVAILABLE",
  UNEXPECTED: "UNEXPECTED",
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

// Único tipo de erro esperado do app. `code` (`<contexto>.<motivo>`) é contrato: a tela traduz
// por ele. `message` é texto técnico para log e nunca chega ao usuário.
export class AppError extends Error {
  readonly type: ErrorType
  readonly code: string

  constructor(type: ErrorType, code: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
    this.type = type
    this.code = code
  }
}
