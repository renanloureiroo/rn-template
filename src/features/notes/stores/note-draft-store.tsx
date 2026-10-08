import { createContext, type PropsWithChildren, useContext, useState } from "react"
import { createStore, type StoreApi, useStore } from "zustand"

// Estado de cliente: o rascunho da nota sobrevive a sair e voltar da tela de criação, mas não é
// dado do servidor, então não passa pelo repositório nem pelo TanStack Query.

export interface NoteDraftState {
  readonly title: string
  // Ações agrupadas e estáveis: um único seletor, sem re-render quando o estado muda.
  readonly actions: {
    changeTitle(title: string): void
    clear(): void
  }
}

export type NoteDraftStore = StoreApi<NoteDraftState>

export function createNoteDraftStore(initial: { title?: string } = {}): NoteDraftStore {
  return createStore<NoteDraftState>()((set) => ({
    title: initial.title ?? "",
    actions: {
      changeTitle: (title) => set({ title }),
      clear: () => set({ title: "" }),
    },
  }))
}

// Store vanilla entregue por Context, e não um hook global: cada teste (e cada provider) tem a
// sua instância, sem reset entre testes e sem mock do Zustand.
const NoteDraftStoreContext = createContext<NoteDraftStore | null>(null)

export function NoteDraftStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store?: NoteDraftStore }>) {
  const [value] = useState(() => store ?? createNoteDraftStore())
  return <NoteDraftStoreContext.Provider value={value}>{children}</NoteDraftStoreContext.Provider>
}

function useNoteDraftStore<T>(selector: (state: NoteDraftState) => T): T {
  const store = useContext(NoteDraftStoreContext)
  if (store === null) {
    throw new Error("useNoteDraftStore precisa estar dentro de um NoteDraftStoreProvider")
  }
  return useStore(store, selector)
}

// Só hooks com seletores atômicos são exportados; o componente nunca assina a store inteira.
export const useNoteDraftTitle = () => useNoteDraftStore((state) => state.title)
export const useNoteDraftActions = () => useNoteDraftStore((state) => state.actions)
