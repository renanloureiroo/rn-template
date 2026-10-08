import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { Host, TextInput } from "@expo/ui"
import { TOptions } from "i18next"

import { Text } from "@/shared/components/Text"
import { TxKeyPath } from "@/shared/i18n"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

export interface TextFieldProps {
  /**
   * A style modifier for different input states.
   */
  status?: "error" | "disabled"
  /**
   * The label text to display if not using `labelTx`.
   */
  label?: string
  labelTx?: TxKeyPath
  labelTxOptions?: TOptions
  /**
   * The helper text to display if not using `helperTx`.
   */
  helper?: string
  helperTx?: TxKeyPath
  helperTxOptions?: TOptions
  /**
   * The placeholder text to display if not using `placeholderTx`.
   */
  placeholder?: string
  placeholderTx?: TxKeyPath
  placeholderTxOptions?: TOptions
  /**
   * Initial text. The field keeps its own state, as Expo UI inputs do; read changes through
   * `onChangeText`.
   */
  defaultValue?: string
  onChangeText?: (text: string) => void
  onSubmitEditing?: (text: string) => void
  maxLength?: number
  autoFocus?: boolean
  /**
   * Style overrides for the container.
   */
  containerStyle?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Campo de texto: label e helper do design system, entrada nativa do Expo UI.
 */
export function TextField(props: TextFieldProps) {
  const {
    status,
    label,
    labelTx,
    labelTxOptions,
    helper,
    helperTx,
    helperTxOptions,
    placeholder,
    placeholderTx,
    placeholderTxOptions,
    defaultValue,
    onChangeText,
    onSubmitEditing,
    maxLength,
    autoFocus,
    containerStyle,
    testID,
  } = props
  const { theme, themed } = useAppTheme()

  const placeholderContent =
    (placeholderTx && translate(placeholderTx, placeholderTxOptions)) || placeholder
  const disabled = status === "disabled"
  const borderColor = status === "error" ? theme.colors.error : theme.colors.border

  return (
    <View style={containerStyle}>
      {!!(label || labelTx) && (
        <Text
          preset="formLabel"
          text={label}
          tx={labelTx}
          txOptions={labelTxOptions}
          style={themed($labelStyle)}
        />
      )}

      <Host
        matchContents={{ vertical: true }}
        colorScheme={theme.isDark ? "dark" : "light"}
        seedColor={theme.colors.tint}
      >
        <TextInput
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholderContent}
          placeholderTextColor={theme.colors.textDim}
          cursorColor={theme.colors.tint}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={!disabled}
          testID={testID}
          style={{
            backgroundColor: theme.colors.palette.neutral100,
            borderColor,
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
          textStyle={{ color: theme.colors.text, fontSize: 16 }}
        />
      </Host>

      {!!(helper || helperTx) && (
        <Text
          preset="formHelper"
          text={helper}
          tx={helperTx}
          txOptions={helperTxOptions}
          style={[themed($helperStyle), status === "error" && { color: theme.colors.error }]}
        />
      )}
    </View>
  )
}

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})
