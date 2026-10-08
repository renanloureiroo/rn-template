import i18n from "i18next"

import { AppError } from "@/shared/errors/app-error"

const UNEXPECTED_KEY = "errors:internal.unexpected"

// Tradução de erro para o usuário, sempre pelo `code` estável (note.not_found vira a chave
// errors:note.not_found). A mensagem técnica do erro nunca chega à tela: ela é para log.
export function errorMessageOf(error: unknown): string {
  if (error instanceof AppError) {
    const key = `errors:${error.code}`
    if (i18n.exists(key)) {
      return i18n.t(key)
    }
  }
  return i18n.t(UNEXPECTED_KEY)
}
