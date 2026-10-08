import { StyleProp, ViewStyle } from "react-native"
import { Host, Switch as NativeSwitch } from "@expo/ui"
import { TOptions } from "i18next"

import { TxKeyPath } from "@/shared/i18n"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"

export interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  /**
   * The label text to display if not using `labelTx`.
   */
  label?: string
  labelTx?: TxKeyPath
  labelTxOptions?: TOptions
  disabled?: boolean
  containerStyle?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Interruptor nativo do Expo UI com label traduzível e cor do tema.
 */
export function Switch(props: SwitchProps) {
  const { value, onValueChange, label, labelTx, labelTxOptions, disabled, containerStyle, testID } =
    props
  const { theme } = useAppTheme()

  return (
    <Host
      matchContents={{ vertical: true }}
      colorScheme={theme.isDark ? "dark" : "light"}
      seedColor={theme.colors.tint}
      style={containerStyle}
    >
      <NativeSwitch
        value={value}
        onValueChange={onValueChange}
        label={(labelTx && translate(labelTx, labelTxOptions)) || label}
        disabled={disabled}
        testID={testID}
      />
    </Host>
  )
}
