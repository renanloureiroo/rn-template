import * as Linking from "expo-linking"
import {
  DarkTheme,
  DefaultTheme,
  type LinkingOptions,
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useReactNavigationDevTools } from "@rozenite/react-navigation-plugin"

import { NoteCreateScreen } from "@/features/notes/views/NoteCreateScreen"
import { NoteDetailScreen } from "@/features/notes/views/NoteDetailScreen"
import { NoteListScreen } from "@/features/notes/views/NoteListScreen"
import type { AppStackParamList, AppStackScreenProps } from "@/navigation/navigationTypes"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"

const Stack = createNativeStackNavigator<AppStackParamList>()

// Mesmas URLs da variante Expo Router: /, /notes/new e /notes/:id.
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      NoteList: "",
      NoteCreate: "notes/new",
      NoteDetail: "notes/:id",
    },
  },
}

// Cada rota é fina: traduz parâmetros e navegação em props da tela da feature.
function NoteListRoute({ navigation }: AppStackScreenProps<"NoteList">) {
  return (
    <NoteListScreen
      onOpenNote={(id) => navigation.navigate("NoteDetail", { id })}
      onCreateNote={() => navigation.navigate("NoteCreate")}
    />
  )
}

function NoteCreateRoute({ navigation }: AppStackScreenProps<"NoteCreate">) {
  return <NoteCreateScreen onCreated={(id) => navigation.replace("NoteDetail", { id })} />
}

function NoteDetailRoute({ route }: AppStackScreenProps<"NoteDetail">) {
  return <NoteDetailScreen noteId={route.params.id} />
}

export function AppNavigator() {
  const { theme } = useAppTheme()
  const base = theme.isDark ? DarkTheme : DefaultTheme
  const navigationRef = useNavigationContainerRef<AppStackParamList>()

  // Painel de navegação no React Native DevTools (Rozenite); no-op em produção.
  useReactNavigationDevTools({ ref: navigationRef })

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={{
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
      <Stack.Navigator
        screenOptions={{ headerTitleStyle: { fontFamily: theme.typography.primary.medium } }}
      >
        <Stack.Screen
          name="NoteList"
          component={NoteListRoute}
          options={{ title: translate("notes:listTitle") }}
        />
        <Stack.Screen
          name="NoteCreate"
          component={NoteCreateRoute}
          options={{ title: translate("notes:createTitle") }}
        />
        <Stack.Screen
          name="NoteDetail"
          component={NoteDetailRoute}
          options={{ title: translate("notes:detailTitle") }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
