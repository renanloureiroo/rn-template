import type { ReactNode } from "react"
import { type StyleProp, View, type ViewStyle } from "react-native"

import {
  useMeasuredWidthClass,
  useWidthClass,
  WidthClassProvider,
} from "@/shared/layout/use-width-class"
import { EVEN_FLEX, LIST_DETAIL_FLEX } from "@/shared/layout/width-class"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

export interface TwoPaneProps {
  start: ReactNode
  end?: ReactNode
  /** Estado vazio do secundário, quando `end` não vem (nenhum item aberto). */
  empty?: ReactNode
  split?: "list-detail" | "even"
  divider?: boolean
  /** Fora da classe expandida: só o `start` ou os dois empilhados. Padrão: `start`. */
  collapsed?: "start" | "stacked"
  testID?: string
}

/**
 * Dois painéis lado a lado na classe expandida (tablet, telefone deitado largo, tela dividida
 * larga), um só ou empilhados nas outras. Cada painel mede a própria largura e publica a classe
 * dele: uma tela dentro do painel se ajusta ao espaço que tem, não ao da janela. O item aberto
 * vive na rota, então girar o aparelho não perde a seleção.
 */
export function TwoPane({
  start,
  end,
  empty,
  split = "list-detail",
  divider = true,
  collapsed = "start",
  testID,
}: TwoPaneProps) {
  const { theme, themed } = useAppTheme()
  const inner = theme.spacing.lg
  const { widthClass, marginStart, marginEnd, onLayout } = useWidthClass()
  const expanded = widthClass === "expanded"
  const flex = split === "even" ? EVEN_FLEX : LIST_DETAIL_FLEX
  const endHidden = !expanded && collapsed === "start"
  const stacked = !expanded && collapsed === "stacked"

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[$container, { flexDirection: expanded ? "row" : "column" }]}
    >
      <Pane
        testID={testID && `${testID}-start`}
        edges={expanded ? { start: marginStart, end: inner } : undefined}
        style={stacked ? undefined : [$pane, expanded ? { flex: flex.start } : $grow]}
      >
        {start}
      </Pane>
      <Pane
        testID={testID && `${testID}-end`}
        hidden={endHidden}
        edges={expanded ? { start: inner, end: marginEnd } : undefined}
        style={[
          stacked ? undefined : [$pane, expanded ? { flex: flex.end } : $grow],
          expanded && split === "list-detail" && divider ? themed($divider) : undefined,
          endHidden ? $hidden : undefined,
        ]}
      >
        {end ?? (expanded ? empty : null)}
      </Pane>
    </View>
  )
}

function Pane({
  testID,
  hidden = false,
  edges,
  style,
  children,
}: {
  testID?: string
  hidden?: boolean
  edges?: { start: number; end: number }
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  const measured = useMeasuredWidthClass()
  const scope =
    edges === undefined
      ? measured
      : { ...measured, marginStart: edges.start, marginEnd: edges.end, inPane: true }
  return (
    <View
      testID={testID}
      onLayout={measured.onLayout}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      style={style}
    >
      <WidthClassProvider value={scope}>{children}</WidthClassProvider>
    </View>
  )
}

const $container: ViewStyle = { flex: 1 }

const $pane: ViewStyle = { minHeight: 0, minWidth: 0, overflow: "hidden" }

const $grow: ViewStyle = { flex: 1 }

const $divider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderStartWidth: 1,
  borderColor: colors.separator,
})

const $hidden: ViewStyle = { display: "none" }
