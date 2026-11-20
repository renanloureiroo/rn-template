import type { Theme } from "@/shared/theme/types"

/** Classe de largura do contêiner: decide o layout e a margem lateral da tela. */
export type WidthClass = "compact" | "medium" | "expanded"

/**
 * Classe da largura medida de um contêiner, pelos limites `breakpoints` do tema. No limite exato,
 * fica na classe maior; largura `0` (ainda sem medida) é `compact`.
 */
export function widthClassOf(width: number, theme: Theme): WidthClass {
  if (width >= theme.breakpoints.expanded) return "expanded"
  if (width >= theme.breakpoints.medium) return "medium"
  return "compact"
}

/** Margem lateral do conteúdo em cada classe: mais respiro quanto mais larga a tela. */
export function screenMarginOf(widthClass: WidthClass, theme: Theme): number {
  switch (widthClass) {
    case "expanded":
      return theme.spacing.xl
    case "medium":
      return theme.spacing.lg
    case "compact":
      return theme.spacing.md
  }
}

/** Pesos da lista e do detalhe lado a lado. */
export const LIST_DETAIL_FLEX = { start: 2, end: 3 } as const

/** Pesos de dois painéis do mesmo tamanho. */
export const EVEN_FLEX = { start: 1, end: 1 } as const
