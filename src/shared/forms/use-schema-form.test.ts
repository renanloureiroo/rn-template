import { act, renderHook } from "@testing-library/react-native"
import { z } from "zod"

import {
  useFormField,
  useFormStatus,
  useFormValue,
  useSchemaForm,
} from "@/shared/forms/use-schema-form"

const nameSchema = z.object({ name: z.string().min(1, { error: "test.name_empty" }) })

const MESSAGES = {
  "test.name_empty": "Dê um nome.",
  "test.name_taken": "Esse nome já existe.",
}

describe("useSchemaForm", () => {
  function renderNameForm(options: { fieldMessages?: Record<string, string> } = {}) {
    return renderHook(() => {
      const form = useSchemaForm(nameSchema, { messages: MESSAGES, defaultValues: { name: "" } })
      const name = useFormField(form, "name", { messages: options.fieldMessages })
      return { form, name }
    })
  }

  it("mostra a regra do schema no campo com o texto do mapa do formulário", async () => {
    const { result } = await renderNameForm()

    await act(() => result.current.form.validate("name"))

    expect(result.current.name.error).toBe("Dê um nome.")
  })

  it("marca o campo com o code de uma recusa e traduz pelo mapa do formulário", async () => {
    const { result } = await renderNameForm()

    await act(() => result.current.form.failField("name", "test.name_taken"))

    expect(result.current.name.error).toBe("Esse nome já existe.")
  })

  it("usa o mapa do campo no lugar do mapa do formulário", async () => {
    const { result } = await renderNameForm({
      fieldMessages: { "test.name_taken": "Escolha outro nome." },
    })

    await act(() => result.current.form.failField("name", "test.name_taken"))

    expect(result.current.name.error).toBe("Escolha outro nome.")
  })

  it("mantém o mesmo formulário entre renderizações", async () => {
    const { result, rerender } = await renderNameForm()
    const first = result.current.form

    await rerender({})

    expect(result.current.form).toBe(first)
  })

  it("valida com o schema montado a partir dos valores", async () => {
    const { result } = await renderHook(() => {
      const form = useSchemaForm(
        (values: { limit: string; amount: string }) =>
          z.object({
            limit: z.string(),
            amount: z.string().refine((amount) => Number(amount) <= Number(values.limit), {
              error: "test.amount_over",
            }),
          }),
        {
          messages: { "test.amount_over": "Passou do limite." },
          defaultValues: { limit: "10", amount: "20" },
        },
      )
      return { form, amount: useFormField(form, "amount") }
    })

    await act(() => result.current.form.validate())
    expect(result.current.amount.error).toBe("Passou do limite.")

    await act(() => result.current.form.setValue("limit", "30"))
    await act(() => result.current.form.validate())
    expect(result.current.amount.error).toBeUndefined()
  })

  it("envia o dado do schema quando passa e avisa quando não passa", async () => {
    const valid = jest.fn()
    const invalid = jest.fn()
    const { result } = await renderNameForm()

    await act(async () => result.current.form.submit(valid, invalid))
    expect(invalid).toHaveBeenCalledTimes(1)
    expect(valid).not.toHaveBeenCalled()
    expect(result.current.name.error).toBe("Dê um nome.")

    await act(() => result.current.name.onChange("Mercado"))
    await act(async () => result.current.form.submit(valid, invalid))
    expect(valid).toHaveBeenCalledWith({ name: "Mercado" })
  })

  it("acompanha o valor e o estado dos campos", async () => {
    const { result } = await renderHook(() => {
      const form = useSchemaForm(nameSchema, { defaultValues: { name: "" } })
      const name = useFormField(form, "name")
      return { form, name, value: useFormValue(form, "name"), status: useFormStatus(form) }
    })

    await act(() => result.current.form.setValue("name", "Feira"))
    expect(result.current.value).toBe("Feira")
    expect(result.current.form.getValue("name")).toBe("Feira")
    expect(result.current.status.isTouched("name")).toBe(false)

    await act(() => result.current.name.onBlur())
    expect(result.current.status.isTouched("name")).toBe(true)
    expect(result.current.form.isTouched("name")).toBe(true)
    expect(result.current.status.submitted).toBe(false)
  })

  it("com validateOn touch valida ao sair do campo", async () => {
    const { result } = await renderHook(() => {
      const form = useSchemaForm(nameSchema, {
        messages: MESSAGES,
        defaultValues: { name: "" },
        validateOn: "touch",
      })
      return { name: useFormField(form, "name") }
    })

    await act(() => result.current.name.onBlur())

    expect(result.current.name.error).toBe("Dê um nome.")
  })

  it("acompanha values sem apagar o que a pessoa editou", async () => {
    const schema = z.object({ email: z.string(), password: z.string() })
    const { result, rerender } = await renderHook(
      ({ email }: { email: string }) => {
        const form = useSchemaForm(schema, { values: { email, password: "" } })
        return { form, password: useFormField(form, "password") }
      },
      { initialProps: { email: "a@sobrou.app" } },
    )

    await act(() => result.current.password.onChange("segredo"))
    await rerender({ email: "b@sobrou.app" })

    expect(result.current.form.getValue("email")).toBe("b@sobrou.app")
    expect(result.current.form.getValue("password")).toBe("segredo")
  })
})
