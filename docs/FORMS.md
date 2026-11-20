# Formulários

Formulário mora na ViewModel; a View só liga cada campo ao componente de entrada. A validação é a
regra do modelo, escrita uma vez como schema do [zod](https://zod.dev), e o estado do formulário é
do [React Hook Form](https://react-hook-form.com). A View e a ViewModel não importam nenhuma das
duas bibliotecas: elas falam com `src/shared/forms`.

## 1. A regra mora no modelo

O schema fica no `model/` da feature. A mensagem de cada regra é o `code` estável do erro, nunca um
texto para o usuário:

```ts
export const noteTitleSchema = z
  .string()
  .refine((title) => title.trim() !== "" && title.length <= NOTE_TITLE_MAX_LENGTH, {
    error: NoteErrorCode.TITLE_INVALID,
  })

export const noteFormSchema = z.object({ title: noteTitleSchema })
```

O mesmo schema serve ao formulário e à validação direta:

- `parseWith(schema, input)` (`@/shared/validation/schema`) devolve o dado já transformado ou lança
  `AppError` de validação com o `code` da primeira regra violada;
- `parseResponse(schema, body)` valida a resposta de um serviço no repositório: contrato quebrado
  vira `internal.unexpected` ali, não espalhado pela tela.

## 2. A ViewModel cria o formulário

```ts
const form = useSchemaForm(noteFormSchema, {
  defaultValues: { title: "" },
  validateOn: "touch",
})

return {
  form,
  submit: () => form.submit((data) => createNote.mutate(data.title)),
}
```

| Opção             | O que faz                                                                          |
| ----------------- | ---------------------------------------------------------------------------------- |
| `defaultValues`   | valores iniciais                                                                   |
| `values`          | valores de uma fonte que muda (dados do servidor), sem apagar o que já foi editado |
| `validateOn`      | `submit` (padrão) valida no primeiro envio; `touch`, quando o campo perde o foco   |
| `focusFirstError` | no envio com erro, o foco vai ao primeiro campo errado (padrão `true`)             |
| `messages`        | textos próprios por `code`, por cima das traduções `errors:<code>`                 |

O schema pode ser uma função dos valores atuais, para limites que dependem de outro campo.

Recusa do servidor ligada a um campo (um nome que já existe) volta ao campo com
`form.failField("title", error.code)`. Erro que não é de campo vai para um aviso da tela.

## 3. A View liga os campos

```tsx
const title = useFormField(form, "title")

<TextField
  ref={title.bindInput}
  value={title.value}
  onChangeText={title.onChange}
  onBlur={title.onBlur}
  status={title.error ? "error" : undefined}
  helper={title.error}
/>
```

`title.error` já chega traduzido: o `code` do schema vira texto por `errorMessageOfCode`, que usa o
mapa `messages` do formulário quando houver e, senão, a tradução `errors:<code>` do i18n.

Para reagir a valores na tela: `useFormValue(form, "campo")`, `useFormValues(form)` e
`useFormStatus(form)` (já enviado, campos tocados).

## 4. Testes

- O schema é testado no modelo, sem React, por `parseWith`, afirmando o `code`.
- A ViewModel é testada com `renderHook`: preencher (`form.setValue`), enviar (`submit`) e afirmar o
  efeito no fake do repositório e o erro do campo.
- A tela é testada pelo que aparece: digitar, enviar e ler a mensagem.
