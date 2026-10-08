import { AppError, ErrorType } from "@/shared/errors/app-error"
import { HttpError, networkUnavailable } from "@/shared/http/http-errors"
import { shouldRetry } from "@/shared/query/query-client"

describe("shouldRetry", () => {
  it("repete até duas vezes quando a fonte não respondeu", () => {
    const offline = networkUnavailable(new Error("offline"))

    expect(shouldRetry(0, offline)).toBe(true)
    expect(shouldRetry(1, offline)).toBe(true)
    expect(shouldRetry(2, offline)).toBe(false)
  })

  it("repete quando o servidor está indisponível", () => {
    expect(shouldRetry(0, HttpError.fromResponse(503, {}))).toBe(true)
  })

  it.each([
    ["404 com code", HttpError.fromResponse(404, { code: "note.not_found" })],
    ["regra do modelo", new AppError(ErrorType.VALIDATION, "note.title_invalid", "inválido")],
    ["erro inesperado do servidor", HttpError.fromResponse(500, {})],
    ["erro que não é do app", new Error("bug")],
  ])("não repete resposta definitiva: %s", (_, error) => {
    expect(shouldRetry(0, error)).toBe(false)
  })
})
