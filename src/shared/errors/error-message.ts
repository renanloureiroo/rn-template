import i18n from "i18next"

import { AppError } from "@/shared/errors/app-error"

const UNEXPECTED_KEY = "errors:internal.unexpected"

// Textos de códigos de erro que uma tela quer dizer do seu jeito, por cima das traduções.
export type ErrorMessages = Readonly<Record<string, string>>

// Tradução de erro para o usuário, sempre pelo `code` estável (note.not_found vira a chave
// errors:note.not_found). A mensagem técnica do erro nunca chega à tela: ela é para log.
export function errorMessageOf(error: unknown, messages: ErrorMessages = {}): string {
  return error instanceof AppError
    ? errorMessageOfCode(error.code, messages)
    : i18n.t(UNEXPECTED_KEY)
}

// O texto de um `code`: o do mapa recebido, senão a tradução errors:<code>, senão o genérico.
export function errorMessageOfCode(code: string, messages: ErrorMessages = {}): string {
  const own = messages[code]
  if (own !== undefined) {
    return own
  }
  const key = `errors:${code}`
  return i18n.exists(key) ? i18n.t(key) : i18n.t(UNEXPECTED_KEY)
}
