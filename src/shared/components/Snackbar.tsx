import { useEffect, useRef } from "react"
import { AccessibilityInfo, Pressable, type TextStyle, View, type ViewStyle } from "react-native"
import { KeyboardStickyView } from "react-native-keyboard-controller"
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/shared/components/Text"
import { useCurrentSnackbar } from "@/shared/snackbar/snackbar-queue"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

/** Quanto o aviso fica na tela; com ação, o dobro, para dar tempo de tocar. */
export const SNACKBAR_DURATION_MS = 4000

export interface SnackbarProps {
  text: string
  action?: { readonly text: string; onPress(): void }
  /** Chamada quando o aviso deve sair: tempo esgotado ou ação tocada. */
  onDismiss: () => void
  /** Quanto o aviso sobe além da área segura, para não cobrir o rodapé fixo da tela. */
  bottomOffset?: number
  testID?: string
}

/**
 * O aviso curto do resultado de uma ação, na base da tela. Respeita o tempo pedido pelas
 * preferências de acessibilidade do sistema e é anunciado pelo leitor de tela.
 */
export function Snackbar({ text, action, onDismiss, bottomOffset = 0, testID }: SnackbarProps) {
  const { themed } = useAppTheme()
  const insets = useSafeAreaInsets()
  useAutoDismiss(text, action ? SNACKBAR_DURATION_MS * 2 : SNACKBAR_DURATION_MS, onDismiss)

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(text)
  }, [text])

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      accessibilityLiveRegion="polite"
      testID={testID}
      style={[themed($snackbar), { marginBottom: insets.bottom + bottomOffset }]}
    >
      <Text text={text} style={themed($text)} />
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            action.onPress()
            onDismiss()
          }}
          testID={testID && `${testID}-action`}
        >
          <Text text={action.text} weight="bold" style={themed($action)} />
        </Pressable>
      ) : null}
    </Animated.View>
  )
}

function useAutoDismiss(text: string, duration: number, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    void AccessibilityInfo.getRecommendedTimeoutMillis(duration).then((recommended) => {
      if (cancelled) return
      timer = setTimeout(() => onDismissRef.current(), Math.max(duration, recommended))
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [text, duration])
}

/**
 * Mostra o aviso da vez da fila (`useSnackbar`), um por vez, acima do teclado e do rodapé da tela
 * da frente. Montado uma vez, na casca do app.
 */
export function SnackbarHost() {
  const { current, bottomInset, dismiss } = useCurrentSnackbar()
  const insets = useSafeAreaInsets()

  return (
    <KeyboardStickyView
      offset={{ closed: 0, opened: insets.bottom }}
      pointerEvents="box-none"
      style={$layer}
    >
      <View pointerEvents="box-none" style={$bottom}>
        {current ? (
          <Snackbar
            key={current.id}
            text={current.text}
            action={current.action}
            bottomOffset={bottomInset}
            onDismiss={() => dismiss(current.id)}
            testID="snackbar"
          />
        ) : null}
      </View>
    </KeyboardStickyView>
  )
}

const $layer: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }

const $bottom: ViewStyle = { flex: 1, justifyContent: "flex-end" }

const $snackbar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  marginHorizontal: spacing.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: spacing.xs,
  backgroundColor: colors.text,
  alignSelf: "center",
  maxWidth: 600,
})

const $text: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.background, flexShrink: 1 })

const $action: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.tint })
