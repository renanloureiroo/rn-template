import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import type { LayoutChangeEvent } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { screenMarginOf, type WidthClass, widthClassOf } from "@/shared/layout/width-class"
import { useAppTheme } from "@/shared/theme/context"

/** Classe e margens de um contêiner, e o `onLayout` que o mede. */
export interface WidthClassMeasure {
  readonly widthClass: WidthClass
  /** Margem lateral da classe; a tela aplica ao próprio conteúdo. */
  readonly margin: number
  /**
   * Margem da borda de início: a `margin` somada à área segura daquele lado (o recorte da câmera
   * com a tela deitada). Num painel do `TwoPane`, a borda junto ao divisor usa só a margem.
   */
  readonly marginStart: number
  /** Margem da borda de fim, pela mesma regra de `marginStart`. */
  readonly marginEnd: number
  /**
   * Dentro de um painel do `TwoPane` lado a lado: o painel é parte de uma tela maior, então um
   * formulário põe a ação logo abaixo dos campos, sem rodapé preso.
   */
  readonly inPane: boolean
  readonly onLayout: (event: LayoutChangeEvent) => void
}

const WidthClassContext = createContext<WidthClassMeasure | null>(null)

function ignoreLayout() {}

/**
 * Mede o contêiner que recebe o `onLayout` devolvido, nunca a janela: `compact` até a primeira
 * medida. Para quem publica a classe aos filhos (a tela, os painéis do `TwoPane`). O contêiner de
 * fora de todos cobre as áreas seguras de lado da janela: a classe vem da largura sem elas, e cada
 * borda soma a sua.
 */
export function useMeasuredWidthClass(): WidthClassMeasure {
  const { theme } = useAppTheme()
  const parent = useContext(WidthClassContext)
  const insets = useSafeAreaInsets()
  const [width, setWidth] = useState(0)
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width),
    [],
  )
  const covered = parent !== null ? { start: 0, end: 0 } : { start: insets.left, end: insets.right }
  const widthClass = widthClassOf(Math.max(0, width - covered.start - covered.end), theme)
  const margin = screenMarginOf(widthClass, theme)
  const edges = parent?.inPane ? parent : null
  return {
    widthClass,
    margin,
    marginStart: edges?.marginStart ?? margin + covered.start,
    marginEnd: edges?.marginEnd ?? margin + covered.end,
    inPane: parent?.inPane ?? false,
    onLayout,
  }
}

/** Publica a classe medida para os filhos; o `useWidthClass` deles lê esta. */
export function WidthClassProvider({
  value,
  children,
}: {
  value: WidthClassMeasure
  children?: ReactNode
}) {
  const { widthClass, margin, marginStart, marginEnd, inPane } = value
  const scope = useMemo(
    () => ({ widthClass, margin, marginStart, marginEnd, inPane, onLayout: ignoreLayout }),
    [widthClass, margin, marginStart, marginEnd, inPane],
  )
  return createElement(WidthClassContext.Provider, { value: scope }, children)
}

/**
 * Classe e margens do contêiner medido mais próximo (a tela ou um painel do `TwoPane`); ali o
 * `onLayout` devolvido não muda nada. Fora de um, mede o contêiner que recebe o `onLayout`. A
 * margem não é aplicada por ninguém: a tela a usa no lugar de um espaçamento fixo.
 */
export function useWidthClass(): WidthClassMeasure {
  const scope = useContext(WidthClassContext)
  const measured = useMeasuredWidthClass()
  return scope ?? measured
}
