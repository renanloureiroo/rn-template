import { ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from "react-native"
import { StatusBar, type StatusBarStyle } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"

import { useAppTheme } from "@/shared/theme/context"
import { $styles } from "@/shared/theme/styles"
import { ExtendedEdge, useSafeAreaInsetsStyle } from "@/shared/utils/useSafeAreaInsetsStyle"

export const DEFAULT_BOTTOM_OFFSET = 50

interface BaseScreenProps {
  /**
   * Children components.
   */
  children?: ReactNode
  /**
   * Style for the outer content container useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Style for the inner content container useful for padding & margin.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: ExtendedEdge[]
  /**
   * Background color
   */
  backgroundColor?: string
  /**
   * Status bar style. Defaults to the opposite of the theme.
   */
  statusBarStyle?: StatusBarStyle
  /**
   * By how much should we offset the keyboard? Defaults to 0.
   */
  keyboardOffset?: number
  /**
   * By how much we scroll up when the keyboard is shown. Defaults to 50.
   */
  keyboardBottomOffset?: number
}

interface FixedScreenProps extends BaseScreenProps {
  preset?: "fixed"
}

interface ScrollScreenProps extends BaseScreenProps {
  preset: "scroll"
  /**
   * Should keyboard persist on screen tap. Defaults to handled.
   */
  keyboardShouldPersistTaps?: "handled" | "always" | "never"
  /**
   * Pass any additional props directly to the ScrollView component.
   */
  ScrollViewProps?: ScrollViewProps
}

export type ScreenProps = FixedScreenProps | ScrollScreenProps

/**
 * Layout base de toda tela: safe area, status bar, teclado e rolagem.
 * Não depende de navegação: funciona igual nas duas variantes.
 */
export function Screen(props: ScreenProps) {
  const {
    theme: { colors },
    themeContext,
  } = useAppTheme()
  const { backgroundColor, keyboardOffset = 0, safeAreaEdges, statusBarStyle } = props

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges)

  return (
    <View
      style={[
        $containerStyle,
        { backgroundColor: backgroundColor || colors.background },
        $containerInsets,
      ]}
    >
      <StatusBar style={statusBarStyle || (themeContext === "dark" ? "light" : "dark")} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
        style={$styles.flex1}
      >
        {props.preset === "scroll" ? (
          <ScreenWithScrolling {...props} />
        ) : (
          <ScreenWithoutScrolling {...props} />
        )}
      </KeyboardAvoidingView>
    </View>
  )
}

function ScreenWithoutScrolling({ style, contentContainerStyle, children }: FixedScreenProps) {
  return (
    <View style={[$outerStyle, style]}>
      <View style={[$innerStyle, $styles.flex1, contentContainerStyle]}>{children}</View>
    </View>
  )
}

function ScreenWithScrolling(props: ScrollScreenProps) {
  const {
    children,
    keyboardShouldPersistTaps = "handled",
    keyboardBottomOffset = DEFAULT_BOTTOM_OFFSET,
    contentContainerStyle,
    ScrollViewProps,
    style,
  } = props

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardBottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...ScrollViewProps}
      style={[$outerStyle, ScrollViewProps?.style, style]}
      contentContainerStyle={[
        $innerStyle,
        ScrollViewProps?.contentContainerStyle,
        contentContainerStyle,
      ]}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

const $containerStyle: ViewStyle = {
  flex: 1,
  height: "100%",
  width: "100%",
}

const $outerStyle: ViewStyle = {
  flex: 1,
  height: "100%",
  width: "100%",
}

const $innerStyle: ViewStyle = {
  justifyContent: "flex-start",
  alignItems: "stretch",
}
