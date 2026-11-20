import type { z } from "zod"

import type { ErrorMessages } from "@/shared/errors/error-message"

/** Os valores de um formulário: um objeto com um valor por campo. */
export type FormValues = object

/** Nome de um campo do formulário. */
export type FieldName<TInput> = Extract<keyof TInput, string>

/**
 * O schema do modelo que valida o formulário: recebe os valores dos campos e devolve o dado do
 * envio. A mensagem de cada regra é o `code` do erro.
 */
export type FormSchema<TInput, TOutput> = z.ZodType<TOutput, TInput>

/**
 * O formulário de uma ViewModel, validado por um schema do modelo. A mensagem de cada regra é o
 * `code` do erro, traduzido no `FormField` pelo mapa da feature.
 */
export interface SchemaForm<TInput extends FormValues, TOutput = TInput> {
  /** Mensagens dos códigos de erro da feature dona do formulário, lidas por `useFormField`. */
  readonly messages: ErrorMessages | undefined
  /**
   * Valida o formulário inteiro e, se passar, chama `onValid` com o dado do schema; se não, leva o
   * erro aos campos e chama `onInvalid`.
   */
  submit(onValid: (data: TOutput) => unknown, onInvalid?: () => void): void
  getValue<K extends FieldName<TInput>>(name: K): TInput[K]
  setValue<K extends FieldName<TInput>>(name: K, value: TInput[K]): void
  /** Volta aos valores iniciais, ou aos passados, e limpa erros e campos tocados. */
  reset(values?: TInput): void
  /** Valida um campo, ou o formulário inteiro, e mostra o erro. Resolve `true` se passou. */
  validate(name?: FieldName<TInput>): Promise<boolean>
  focus(name: FieldName<TInput>): void
  /** A pessoa já saiu do campo ao menos uma vez. */
  isTouched(name: FieldName<TInput>): boolean
  clearError(name: FieldName<TInput>): void
  /** Marca o campo com o `code` de um erro (uma recusa do serviço), traduzido no `FormField`. */
  failField(name: FieldName<TInput>, code: string, options?: { shouldFocus: boolean }): void
}

export interface SchemaFormOptions<TInput extends FormValues> {
  /** Mensagens dos códigos de erro da feature dona do formulário. */
  messages?: ErrorMessages
  defaultValues?: TInput
  /**
   * Valores vindos de uma fonte que pode mudar (o e-mail da sessão): a cada mudança preenchem o
   * formulário, sem apagar o que a pessoa já editou.
   */
  values?: TInput
  /**
   * Quando um campo passa a ser validado: `submit` (padrão) no primeiro envio, `touch` quando a
   * pessoa sai dele pela primeira vez. Depois disso, a cada edição.
   */
  validateOn?: "submit" | "touch"
  /** No envio com erro, o foco vai ao primeiro campo errado. Padrão `true`. */
  focusFirstError?: boolean
}

/**
 * Cria um formulário validado pelo schema do modelo. O schema pode depender dos valores (limites
 * que mudam com outro campo).
 */
export type UseSchemaForm = <TInput extends FormValues, TOutput extends FormValues = TInput>(
  schema: FormSchema<TInput, TOutput> | ((values: TInput) => FormSchema<TInput, TOutput>),
  options?: SchemaFormOptions<TInput>,
) => SchemaForm<TInput, TOutput>

/**
 * O que a View recebe de cada campo de texto: valor, erro já traduzido e os eventos. A View liga
 * isso ao Input do design system sem conhecer o formulário.
 */
export interface FormField {
  readonly value: string
  readonly error: string | undefined
  onChange(text: string): void
  /** O campo perdeu o foco: marca como tocado e valida, conforme `validateOn`. */
  onBlur(): void
  /**
   * Liga o campo de texto ao formulário (vai no `ref` do Input), para o foco ir ao primeiro campo
   * com erro.
   */
  bindInput(instance: FocusableInput | null): void
  /** Leva o foco ao campo ligado por `bindInput` (o próximo campo, na tecla de retorno). */
  focus(): void
}

export interface FocusableInput {
  focus(): void
}

export interface FormFieldOptions {
  /** Mensagens dos códigos de erro, no lugar das que o formulário recebeu. */
  messages?: ErrorMessages
  /**
   * Chamado a cada edição, depois de o formulário registrar o valor (limpar erro de envio,
   * espelhar um rascunho, revalidar um campo dependente).
   */
  onEdit?: (text: string) => void
}

/**
 * Expõe um campo de texto do formulário para a View. A mensagem do schema é o `code` do erro,
 * traduzido pelo mapa do campo ou do formulário.
 */
export type UseFormField = <TInput extends FormValues>(
  form: SchemaForm<TInput, unknown>,
  name: FieldName<TInput>,
  options?: FormFieldOptions,
) => FormField

/** O valor atual de um campo, que atualiza a tela a cada edição. */
export type UseFormValue = <TInput extends FormValues, K extends FieldName<TInput>>(
  form: SchemaForm<TInput, unknown>,
  name: K,
) => TInput[K]

/** Os valores atuais do formulário inteiro, que atualizam a tela a cada edição. */
export type UseFormValues = <TInput extends FormValues>(form: SchemaForm<TInput, unknown>) => TInput

export interface FormStatus<TInput> {
  /** O formulário já foi enviado ao menos uma vez. */
  readonly submitted: boolean
  /** A pessoa já saiu do campo ao menos uma vez. */
  isTouched(name: FieldName<TInput>): boolean
}

/** Se o formulário já foi enviado e quais campos foram tocados, atualizando a tela. */
export type UseFormStatus = <TInput extends FormValues>(
  form: SchemaForm<TInput, unknown>,
) => FormStatus<TInput>
