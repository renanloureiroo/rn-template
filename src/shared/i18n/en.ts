import notesEn from "@/features/notes/i18n/en"

// Cada namespace de primeiro nível é usado como `namespace:chave` (convenção do projeto).
// Features contribuem com o próprio namespace e com os erros do seu contexto em `errors`.
const en = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    back: "Back",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen your users see when an unexpected error escapes the app. Customize the message in src/shared/i18n and the layout in src/shared/errors.",
    reset: "RESET APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try again in a moment.",
      button: "Let's try this again",
    },
  },
  // Mensagem por `code` estável de AppError. `code` desconhecido cai em
  // internal.unexpected (ver src/shared/errors/error-message.ts).
  errors: {
    request: {
      invalid: "The request was rejected. Review the data and try again.",
      not_found: "Resource not found.",
    },
    network: {
      unavailable: "You seem to be offline. Check your connection and try again.",
      timeout: "The server took too long to answer. Try again.",
    },
    internal: {
      unexpected: "Something unexpected happened. Try again.",
    },
    note: notesEn.errors,
  },
  notes: notesEn.notes,
}

export default en
export type Translations = typeof en
