import { PropsWithChildren, useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import type { AppDependencies } from "@/bootstrap/app-dependencies"
import { DevTools } from "@/bootstrap/DevTools"
import { NotesProvider } from "@/features/notes/NotesProvider"
import { ErrorBoundary } from "@/shared/errors/ErrorBoundary"
import { initI18n } from "@/shared/i18n"
import { QueryProvider } from "@/shared/query/QueryProvider"
import { ThemeProvider } from "@/shared/theme/context"
import { customFontsToLoad } from "@/shared/theme/typography"
import { loadDateFnsLocale } from "@/shared/utils/formatDate"

SplashScreen.preventAutoHideAsync().catch(() => {
  // Em web e em testes não há splash nativa para segurar.
})

export interface AppShellProps {
  dependencies: AppDependencies
}

/**
 * Casca comum às duas variantes de navegação (Expo Router e React Navigation): carrega fontes e
 * i18n, e monta os providers na ordem em que dependem uns dos outros, incluindo o provider de cada
 * feature com as dependências dela. A navegação entra como `children`.
 */
export function AppShell({ dependencies, children }: PropsWithChildren<AppShellProps>) {
  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => loadDateFnsLocale())
      .then(() => setIsI18nInitialized(true))
  }, [])

  const isReady = isI18nInitialized && (areFontsLoaded || !!fontLoadError)

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [isReady])

  // Enquanto não estiver pronto, a splash nativa continua na tela.
  if (!isReady) {
    return null
  }

  // GestureHandlerRootView é a raiz de toda a árvore: gestos (swipe, bottom sheet, drawer) só
  // funcionam em componentes abaixo dele.
  return (
    <GestureHandlerRootView style={$root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <ThemeProvider storage={dependencies.storage}>
            <ErrorBoundary catchErrors="always">
              <QueryProvider storage={dependencies.storage}>
                <DevTools storage={dependencies.storage} />
                <NotesProvider dependencies={dependencies.notes}>{children}</NotesProvider>
              </QueryProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const $root: ViewStyle = { flex: 1 }
