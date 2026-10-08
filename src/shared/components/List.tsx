import { ReactNode } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { Host, List as NativeList, ListItem as NativeListItem } from "@expo/ui"

import { useAppTheme } from "@/shared/theme/context"

export interface ListProps {
  children?: ReactNode
  /**
   * Pull-to-refresh. The list shows the native indicator until the promise settles.
   */
  onRefresh?: () => Promise<void>
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Lista nativa e virtualizada (List do SwiftUI / LazyColumn do Compose). Os filhos precisam
 * ser `ListItem`: componentes React Native não podem ser renderizados dentro dela.
 */
export function List({ children, onRefresh, style, testID }: ListProps) {
  const { theme } = useAppTheme()

  return (
    <Host
      useViewportSizeMeasurement
      colorScheme={theme.isDark ? "dark" : "light"}
      seedColor={theme.colors.tint}
      style={[{ flex: 1 }, style]}
    >
      <NativeList onRefresh={onRefresh} testID={testID}>
        {children}
      </NativeList>
    </Host>
  )
}

export interface ListItemProps {
  text: string
  supportingText?: string
  onPress?: () => void
  testID?: string
}

export function ListItem({ text, supportingText, onPress, testID }: ListItemProps) {
  const { theme } = useAppTheme()

  return (
    <NativeListItem
      supportingText={supportingText}
      onPress={onPress}
      testID={testID}
      colors={{
        contentColor: theme.colors.text,
        supportingContentColor: theme.colors.textDim,
      }}
    >
      {text}
    </NativeListItem>
  )
}
