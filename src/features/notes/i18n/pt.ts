import type en from "@/features/notes/i18n/en"

const pt: typeof en = {
  notes: {
    listTitle: "Notas",
    detailTitle: "Nota",
    createTitle: "Nova nota",
    newNote: "Nova nota",
    loadMore: "Carregar mais",
    createdAt: "Criada em {{date}}",
    emptyHeading: "Nenhuma nota ainda",
    emptyContent: "Crie a primeira nota para ver o fluxo completo: view, view model e repositório.",
    titleLabel: "Título",
    titlePlaceholder: "Sobre o que é esta nota?",
    titleHelper: "{{length}} de {{max}} caracteres",
    save: "Salvar",
    retry: "Tentar de novo",
  },
  errors: {
    title_invalid: "O título é obrigatório e pode ter no máximo 120 caracteres.",
    not_found: "Esta nota não existe mais.",
  },
}

export default pt
