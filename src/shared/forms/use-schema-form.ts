import { useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  type Control,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type PathValue,
  useController,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form"

import { errorMessageOfCode } from "@/shared/errors/error-message"
import type {
  FieldName,
  FocusableInput,
  FormFieldOptions,
  FormSchema,
  FormValues,
  SchemaForm,
  SchemaFormOptions,
  UseFormField,
  UseFormStatus,
  UseFormValue,
  UseFormValues,
  UseSchemaForm,
} from "@/shared/forms/form"

type Values<T> = T & FieldValues

const controls = new WeakMap<object, Control<FieldValues, unknown, FieldValues>>()

export const useSchemaForm: UseSchemaForm = <
  TInput extends FormValues,
  TOutput extends FormValues = TInput,
>(
  schema: FormSchema<TInput, TOutput> | ((values: TInput) => FormSchema<TInput, TOutput>),
  options: SchemaFormOptions<TInput> = {},
): SchemaForm<TInput, TOutput> => {
  const { messages, defaultValues, values, validateOn = "submit", focusFirstError = true } = options
  const resolverOf = (current: FormSchema<TInput, TOutput>) =>
    zodResolver<Values<TInput>, unknown, Values<TOutput>>(
      current as unknown as FormSchema<Values<TInput>, Values<TOutput>>,
    )
  const form = useForm<Values<TInput>, unknown, Values<TOutput>>({
    defaultValues: defaultValues as DefaultValues<Values<TInput>> | undefined,
    values: values as Values<TInput> | undefined,
    resetOptions: values === undefined ? undefined : { keepDirtyValues: true },
    mode: validateOn === "touch" ? "onTouched" : "onSubmit",
    shouldFocusError: focusFirstError,
    resolver:
      typeof schema === "function"
        ? (current, context, resolverOptions) =>
            resolverOf(schema(current))(current, context, resolverOptions)
        : resolverOf(schema),
  })

  return useMemo(() => {
    const path = (name: FieldName<TInput>) => name as unknown as FieldPath<Values<TInput>>
    const schemaForm: SchemaForm<TInput, TOutput> = {
      messages,
      submit: (onValid, onInvalid) => {
        void form.handleSubmit(
          (data) => {
            onValid(data)
          },
          () => onInvalid?.(),
        )()
      },
      getValue: (name) => form.getValues(path(name)) as TInput[typeof name],
      setValue: (name, value) =>
        form.setValue(path(name), value as PathValue<Values<TInput>, FieldPath<Values<TInput>>>),
      reset: (next) => form.reset(next as Values<TInput> | undefined),
      validate: (name) => form.trigger(name === undefined ? undefined : path(name)),
      focus: (name) => form.setFocus(path(name)),
      isTouched: (name) => form.getFieldState(path(name)).isTouched,
      clearError: (name) => form.clearErrors(path(name)),
      failField: (name, code, failOptions) =>
        form.setError(path(name), { message: code }, failOptions),
    }
    controls.set(schemaForm, form.control as unknown as Control<FieldValues, unknown, FieldValues>)
    return schemaForm
  }, [form, messages])
}

export const useFormValue: UseFormValue = <TInput extends FormValues, K extends FieldName<TInput>>(
  form: SchemaForm<TInput, unknown>,
  name: K,
) =>
  useWatch({
    control: controlOf(form),
    name: name as unknown as FieldPath<Values<TInput>>,
  }) as TInput[K]

export const useFormValues: UseFormValues = <TInput extends FormValues>(
  form: SchemaForm<TInput, unknown>,
) => useWatch({ control: controlOf(form) }) as TInput

export const useFormStatus: UseFormStatus = (form) => {
  const { isSubmitted, touchedFields } = useFormState({ control: controlOf(form) })
  const touched = touchedFields as Partial<Record<string, boolean>>
  return { submitted: isSubmitted, isTouched: (name) => touched[name] === true }
}

function controlOf<TInput extends FormValues>(
  form: SchemaForm<TInput, unknown>,
): Control<Values<TInput>, unknown, Values<TInput>> {
  const control = controls.get(form)
  if (control === undefined) throw new Error("Formulário criado fora de useSchemaForm.")
  return control as unknown as Control<Values<TInput>, unknown, Values<TInput>>
}

export const useFormField: UseFormField = <TInput extends FormValues>(
  form: SchemaForm<TInput, unknown>,
  name: FieldName<TInput>,
  options: FormFieldOptions = {},
) => {
  const { field, fieldState } = useController({
    control: controlOf(form),
    name: name as unknown as FieldPath<Values<TInput>>,
  })
  const input = useRef<FocusableInput | null>(null)
  const code = fieldState.error?.message

  return {
    value: typeof field.value === "string" ? field.value : "",
    error: code ? errorMessageOfCode(code, options.messages ?? form.messages) : undefined,
    onChange: (text: string) => {
      field.onChange(text)
      options.onEdit?.(text)
    },
    onBlur: field.onBlur,
    bindInput: (instance: FocusableInput | null) => {
      input.current = instance
      field.ref(instance)
    },
    focus: () => input.current?.focus(),
  }
}
