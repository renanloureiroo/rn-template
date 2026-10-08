import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"

import { createAppDependencies } from "@/bootstrap/app-dependencies"
import { AppShell } from "@/bootstrap/AppShell"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"

// Dependências criadas uma vez por processo do app.
const dependencies = createAppDependencies()

export default function RootLayout() {
  return (
    <AppShell dependencies={dependencies}>
      <RootStack />
    </AppShell>
  )
}

// Rotas são finas: cada arquivo em src/app só traduz parâmetros e navegação em
// props da tela da feature. O tema da navegação deriva dos tokens do design system.
function RootStack() {
  const { theme } = useAppTheme()
  const base = theme.isDark ? DarkTheme : DefaultTheme

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.colors.tint,
          background: theme.colors.background,
          card: theme.colors.background,
          text: theme.colors.text,
          border: theme.colors.separator,
          notification: theme.colors.error,
        },
      }}
    >
      <Stack screenOptions={{ headerTitleStyle: { fontFamily: theme.typography.primary.medium } }}>
        <Stack.Screen name="index" options={{ title: translate("notes:listTitle") }} />
        <Stack.Screen name="notes/new" options={{ title: translate("notes:createTitle") }} />
        <Stack.Screen name="notes/[id]" options={{ title: translate("notes:detailTitle") }} />
      </Stack>
    </ThemeProvider>
  )
}
