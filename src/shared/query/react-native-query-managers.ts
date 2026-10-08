import { AppState, Platform } from "react-native"
import * as Network from "expo-network"
import { focusManager, onlineManager } from "@tanstack/react-query"

// No React Native não existem os eventos de foco e conexão do navegador que o TanStack Query
// observa. Estes ouvintes informam quando o app volta ao primeiro plano e quando a rede volta,
// disparando a revalidação das queries ativas.
export function connectQueryManagers(): () => void {
  const appState = AppState.addEventListener("change", (status) => {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active")
    }
  })

  onlineManager.setEventListener((setOnline) => {
    const network = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false)
    })
    return () => network.remove()
  })

  return () => appState.remove()
}
