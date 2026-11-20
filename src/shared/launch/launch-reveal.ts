import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

interface LaunchRevealState {
  readonly revealed: boolean
}

const store = createStore<LaunchRevealState>(() => ({ revealed: false }))

export const launchReveal = {
  reveal(): void {
    store.setState({ revealed: true })
  },
  conceal(): void {
    store.setState({ revealed: false })
  },
}

/**
 * `true` depois que a abertura tirou a splash nativa da frente. Campos com foco automático só
 * focam a partir daí, para o teclado não subir por cima da splash.
 */
export function useLaunchRevealed(): boolean {
  return useStore(store, (state) => state.revealed)
}
