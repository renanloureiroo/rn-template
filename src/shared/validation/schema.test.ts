import { z } from "zod"

import { AppError, ErrorType } from "@/shared/errors/app-error"
import { parseWith } from "@/shared/validation/schema"
import { captureError } from "@test/support/capture-error"

describe("parseWith", () => {
  const schema = z.object({
    name: z.string().trim().min(1, { error: "person.name_required" }),
    age: z.number().int().min(18, { error: "person.too_young" }),
  })

  it("devolve o dado transformado pelo schema", () => {
    expect(parseWith(schema, { name: "  Ana ", age: 30 })).toEqual({ name: "Ana", age: 30 })
  })

  it("lança AppError de validação com o code da primeira regra violada", () => {
    const error = captureError(() => parseWith(schema, { name: " ", age: 10 }))

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: "person.name_required" })
  })
})
