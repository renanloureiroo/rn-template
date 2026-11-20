import type { z } from "zod"

import { AppError, ErrorType } from "@/shared/errors/app-error"

/** Valida fora de formulário (regra do modelo chamada direto): devolve o dado já transformado ou lança `AppError` de validação com o `code` da primeira regra violada. A mensagem de cada regra do schema é o `code` estável do erro (`{ error: "auth.email_invalid" }`), e nenhum texto para o usuário mora no schema. */
export function parseWith<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    const code = result.error.issues[0]?.message ?? "request.invalid"
    throw new AppError(ErrorType.VALIDATION, code, `Entrada inválida: ${code}`, {
      cause: result.error,
    })
  }
  return result.data
}

/**
 * Valida a resposta de um serviço pelo schema e devolve o dado lido. Resposta fora do combinado
 * lança `AppError(UNEXPECTED, "internal.unexpected")`: o contrato quebrado falha no repositório,
 * não espalhado pela tela.
 */
export function parseResponse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new AppError(
      ErrorType.UNEXPECTED,
      "internal.unexpected",
      "Resposta do serviço fora do combinado",
      { cause: result.error },
    )
  }
  return result.data
}
