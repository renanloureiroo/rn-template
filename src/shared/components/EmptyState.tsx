import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { TOptions } from "i18next"

import { Button } from "@/shared/components/Button"
import { Text } from "@/shared/components/Text"
import { TxKeyPath } from "@/shared/i18n"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

export interface EmptyStateProps {
  /**
   * The text set used when neither `heading` nor `headingTx` is given.
   */
  preset?: "generic"
  heading?: string
  headingTx?: TxKeyPath
  headingTxOptions?: TOptions
  content?: string
  contentTx?: TxKeyPath
  contentTxOptions?: TOptions
  button?: string
  buttonTx?: TxKeyPath
  buttonOnPress?: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Estado vazio: título, texto e uma ação opcional.
 */
export function EmptyState(props: EmptyStateProps) {
  const { themed } = useAppTheme()
  const preset = props.preset ?? "generic"

  // Os textos do preset só entram quando a tela não informa um título próprio.
  const usePreset = props.heading === undefined && props.headingTx === undefined
  const heading =
    props.heading ??
    translate(props.headingTx ?? `emptyStateComponent:${preset}.heading`, props.headingTxOptions)
  const content =
    props.content ??
    (props.contentTx
      ? translate(props.contentTx, props.contentTxOptions)
      : usePreset
        ? translate(`emptyStateComponent:${preset}.content`)
        : undefined)
  const button = props.button ?? (props.buttonTx ? translate(props.buttonTx) : undefined)

  return (
    <View style={[themed($container), props.style]} testID={props.testID}>
      <Text preset="subheading" text={heading} style={$heading} />
      {!!content && <Text text={content} style={themed($content)} />}
      {!!button && !!props.buttonOnPress && (
        <Button text={button} onPress={props.buttonOnPress} style={themed($button)} />
      )}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xl,
})

const $heading: TextStyle = {
  textAlign: "center",
}

const $content: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
