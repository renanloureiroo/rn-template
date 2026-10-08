import "@expo/metro-runtime"
import { registerRootComponent } from "expo"

import { App } from "@/navigation/App"

// Ponto de entrada da variante React Navigation (package.json "main"). Na variante Expo Router
// a entrada é "expo-router/entry" e este diretório não existe.
registerRootComponent(App)
