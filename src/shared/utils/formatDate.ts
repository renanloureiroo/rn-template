// Imports por caminho: `import { format } from "date-fns"` traria a biblioteca inteira para o
// bundle, já que o Metro não faz tree-shaking.
import { format } from "date-fns/format"
import type { Locale } from "date-fns/locale"
import { enUS } from "date-fns/locale/en-US"
import { ptBR } from "date-fns/locale/pt-BR"
import { parseISO } from "date-fns/parseISO"
import i18n from "i18next"

type Options = Parameters<typeof format>[2]

const LOCALES: Record<string, Locale> = { en: enUS, pt: ptBR }

let dateFnsLocale: Locale = enUS

// Chamado depois do initI18n: acompanha o idioma escolhido para as traduções.
export const loadDateFnsLocale = () => {
  const primaryTag = i18n.language.split("-")[0] ?? ""
  dateFnsLocale = LOCALES[primaryTag] ?? enUS
}

// "PP" é a data média do locale: "Mar 10, 2026" em inglês, "10 mar 2026" em português.
export const formatDate = (date: string, dateFormat?: string, options?: Options) => {
  return format(parseISO(date), dateFormat ?? "PP", { ...options, locale: dateFnsLocale })
}
