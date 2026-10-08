import { StyleProp, ViewStyle } from "react-native"
import { Button as NativeButton, Host } from "@expo/ui"
import { TOptions } from "i18next"

import { TxKeyPath } from "@/shared/i18n"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"

type Presets = "filled" | "outlined" | "text"

export interface ButtonProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TxKeyPath
  /**
   * The text to display if not using `tx`.
   */
  text?: string
  /**
   * Optional options to pass to i18n.
   */
  txOptions?: TOptions
  /**
   * One of the different types of button presets. Maps 1:1 to Expo UI variants.
   */
  preset?: Presets
  /**
   * Style for the outer container, useful for margin and alignment.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Disabled buttons do not respond to presses.
   */
  disabled?: boolean
  onPress?: () => void
  testID?: string
}

/**
 * Botão nativo (SwiftUI no iOS, Jetpack Compose no Android) com a API do design system:
 * `tx`, presets e tema. A cor do tema chega ao componente nativo como `seedColor` do Host.
 */
export function Button(props: ButtonProps) {
  const { tx, txOptions, text, preset = "filled", style, disabled, onPress, testID } = props
  const { theme } = useAppTheme()

  const label = (tx && translate(tx, txOptions)) || text

  return (
    <Host
      matchContents
      colorScheme={theme.isDark ? "dark" : "light"}
      seedColor={theme.colors.tint}
      style={style}
    >
      <NativeButton
        label={label}
        variant={preset}
        disabled={disabled}
        onPress={onPress}
        testID={testID}
      />
    </Host>
  )
}
