import { AppError, ErrorType } from "@/shared/errors/app-error"
import { errorMessageOf } from "@/shared/errors/error-message"
import { HttpError, networkUnavailable } from "@/shared/http/http-errors"

describe("errorMessageOf", () => {
  it("traduz pelo code do erro do app", () => {
    const error = new AppError(ErrorType.VALIDATION, "note.title_invalid", "mensagem técnica")

    expect(errorMessageOf(error)).toBe(
      "O título é obrigatório e pode ter no máximo 120 caracteres.",
    )
  })

  it("traduz pelo code vindo do servidor", () => {
    expect(errorMessageOf(HttpError.fromResponse(404, { code: "note.not_found" }))).toBe(
      "Esta nota não existe mais.",
    )
  })

  it("traduz falha de rede", () => {
    expect(errorMessageOf(networkUnavailable(new Error("offline")))).toBe(
      "Parece que você está sem conexão. Verifique a rede e tente de novo.",
    )
  })

  it.each([
    ["code sem tradução", new AppError(ErrorType.BUSINESS_RULE, "billing.limit_reached", "x")],
    ["erro que não é do app", new Error("bug interno com detalhe sensível")],
    ["valor que não é erro", "falhou"],
  ])("usa a mensagem genérica para %s, sem vazar a mensagem técnica", (_, error) => {
    expect(errorMessageOf(error)).toBe("Algo inesperado aconteceu. Tente de novo.")
  })
})
