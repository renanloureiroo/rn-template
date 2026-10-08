import notesPt from "@/features/notes/i18n/pt"
import type { Translations } from "@/shared/i18n/en"

const pt: Translations = {
  common: {
    ok: "OK",
    cancel: "Cancelar",
    back: "Voltar",
  },
  errorScreen: {
    title: "Algo deu errado!",
    friendlySubtitle:
      "Esta é a tela que o usuário vê quando um erro inesperado escapa do app. Personalize a mensagem em src/shared/i18n e o layout em src/shared/errors.",
    reset: "REINICIAR APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "Nada por aqui",
      content: "Nenhum dado encontrado ainda. Tente de novo em instantes.",
      button: "Tentar de novo",
    },
  },
  errors: {
    request: {
      invalid: "A requisição foi recusada. Revise os dados e tente de novo.",
      not_found: "Recurso não encontrado.",
    },
    network: {
      unavailable: "Parece que você está sem conexão. Verifique a rede e tente de novo.",
      timeout: "O servidor demorou demais para responder. Tente de novo.",
    },
    internal: {
      unexpected: "Algo inesperado aconteceu. Tente de novo.",
    },
    note: notesPt.errors,
  },
  notes: notesPt.notes,
}

export default pt
