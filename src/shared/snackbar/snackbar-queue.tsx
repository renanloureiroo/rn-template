import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"
import { createStore, type StoreApi, useStore } from "zustand"

/** O aviso que uma ViewModel pede: o resultado de uma ação e, opcionalmente, como desfazer ou repetir. */
export interface SnackbarMessage {
  readonly text: string
  readonly action?: { readonly text: string; onPress(): void }
  /** O aviso saiu da fila: pelo tempo, pela ação ou porque quem o pediu saiu. */
  readonly onDismissed?: () => void
}

export interface QueuedSnackbar extends SnackbarMessage {
  readonly id: number
  readonly owner?: string
}

export interface SideInsets {
  readonly left: number
  readonly right: number
}

const NO_SIDES: SideInsets = { left: 0, right: 0 }

interface BottomInset {
  readonly owner: string
  readonly height: number
  readonly sides: SideInsets
}

export interface SnackbarQueueState {
  /** O primeiro é o que está na tela; os outros esperam a vez. */
  readonly queue: readonly QueuedSnackbar[]
  /**
   * Altura do rodapé e recuo dos lados de cada tela montada; vale o da última, a que está na frente.
   */
  readonly bottomInsets: readonly BottomInset[]
  readonly actions: {
    show(message: SnackbarMessage, owner?: string): void
    dismiss(id: number): void
    dismissOwnedBy(owner: string): void
    setBottomInset(owner: string, height: number, sides?: SideInsets): void
    clearBottomInset(owner: string): void
  }
}

export type SnackbarQueue = StoreApi<SnackbarQueueState>

export function createSnackbarQueue(): SnackbarQueue {
  let nextId = 1
  return createStore<SnackbarQueueState>()((set, get) => ({
    queue: [],
    bottomInsets: [],
    actions: {
      show: (message, owner) =>
        set((state) =>
          state.queue.some((queued) => queued.text === message.text)
            ? state
            : { queue: [...state.queue, { ...message, id: nextId++, owner }] },
        ),
      dismiss: (id) => {
        const leaving = get().queue.filter((queued) => queued.id === id)
        set((state) => ({ queue: state.queue.filter((queued) => queued.id !== id) }))
        leaving.forEach((queued) => queued.onDismissed?.())
      },
      dismissOwnedBy: (owner) => {
        const leaving = get().queue.filter((queued) => queued.owner === owner)
        set((state) => ({ queue: state.queue.filter((queued) => queued.owner !== owner) }))
        leaving.forEach((queued) => queued.onDismissed?.())
      },
      setBottomInset: (owner, height, sides = NO_SIDES) =>
        set((state) => ({
          bottomInsets: state.bottomInsets.some((inset) => inset.owner === owner)
            ? state.bottomInsets.map((inset) =>
                inset.owner === owner ? { owner, height, sides } : inset,
              )
            : [...state.bottomInsets, { owner, height, sides }],
        })),
      clearBottomInset: (owner) =>
        set((state) => ({
          bottomInsets: state.bottomInsets.filter((inset) => inset.owner !== owner),
        })),
    },
  }))
}

const SnackbarQueueContext = createContext<SnackbarQueue | null>(null)

export function SnackbarQueueProvider({
  queue,
  children,
}: PropsWithChildren<{ queue?: SnackbarQueue }>) {
  const [value] = useState(() => queue ?? createSnackbarQueue())
  return <SnackbarQueueContext.Provider value={value}>{children}</SnackbarQueueContext.Provider>
}

function useSnackbarQueue<T>(selector: (state: SnackbarQueueState) => T): T {
  const queue = useContext(SnackbarQueueContext)
  if (queue === null) {
    throw new Error("useSnackbarQueue precisa estar dentro de um SnackbarQueueProvider")
  }
  return useStore(queue, selector)
}

export interface Snackbars {
  /**
   * Põe o aviso na fila (um por vez; o mesmo texto não se repete). Aviso com ação pertence a quem
   * pediu e sai quando ele é desmontado, porque a ação depende dele.
   */
  show(message: SnackbarMessage): void
  /** Tira da fila os avisos com ação que este dono pediu (um aviso novo substitui o anterior). */
  dismissOwn(): void
}

export function useSnackbar(): Snackbars {
  const actions = useSnackbarQueue((state) => state.actions)
  const owner = useId()

  useEffect(() => () => actions.dismissOwnedBy(owner), [actions, owner])

  return {
    show: (message) => actions.show(message, message.action ? owner : undefined),
    dismissOwn: () => actions.dismissOwnedBy(owner),
  }
}

/**
 * O aviso da vez, quanto ele sobe por causa do rodapé da tela da frente e quanto recua dos lados
 * por causa de uma barra de abas na lateral.
 */
export function useCurrentSnackbar(): {
  readonly current: QueuedSnackbar | undefined
  readonly bottomInset: number
  readonly sideInsets: SideInsets
  dismiss(id: number): void
} {
  const current = useSnackbarQueue((state) => state.queue[0])
  const bottomInset = useSnackbarQueue((state) => state.bottomInsets.at(-1)?.height ?? 0)
  const sideInsets = useSnackbarQueue((state) => state.bottomInsets.at(-1)?.sides ?? NO_SIDES)
  const actions = useSnackbarQueue((state) => state.actions)
  return { current, bottomInset, sideInsets, dismiss: actions.dismiss }
}

interface SnackbarInsetScopeValue {
  readonly active: boolean
  readonly offset: number
  readonly sides: SideInsets
}

const SnackbarInsetScopeContext = createContext<SnackbarInsetScopeValue>({
  active: true,
  offset: 0,
  sides: NO_SIDES,
})

export interface SnackbarInsetScopeProps {
  /**
   * As telas de dentro estão na frente (a aba em foco). Fora de foco, elas não informam rodapé.
   */
  active?: boolean
  /**
   * Espaço que já cobre a base da tela e soma ao rodapé de cada uma (a barra de abas).
   */
  offset: number
  /**
   * Quanto a barra de abas cobre de cada lado (o trilho na lateral da tela dividida do iPhone Duo).
   * Padrão: nada.
   */
  sides?: SideInsets
}

/**
 * Agrupa as telas de uma aba: o aviso fica acima do espaço dela e só a aba em foco conta.
 */
export function SnackbarInsetScope({
  active = true,
  offset,
  sides = NO_SIDES,
  children,
}: PropsWithChildren<SnackbarInsetScopeProps>) {
  const { left, right } = sides
  const value = useMemo(
    () => ({ active, offset, sides: { left, right } }),
    [active, offset, left, right],
  )
  return (
    <SnackbarInsetScopeContext.Provider value={value}>
      {children}
    </SnackbarInsetScopeContext.Provider>
  )
}

/**
 * Informa a altura do rodapé fixo da tela, para o aviso não cobrir as ações. Dentro de um
 * `SnackbarInsetScope`, soma o espaço dele e só conta enquanto ele estiver ativo. Fora de um
 * `SnackbarQueueProvider` não faz nada.
 */
export function useSnackbarBottomInset(height: number): void {
  const queue = useContext(SnackbarQueueContext)
  const scope = useContext(SnackbarInsetScopeContext)
  const owner = useId()

  useEffect(() => {
    if (scope.active) {
      queue?.getState().actions.setBottomInset(owner, height + scope.offset, scope.sides)
    } else {
      queue?.getState().actions.clearBottomInset(owner)
    }
  }, [queue, owner, height, scope.active, scope.offset, scope.sides])

  useEffect(() => () => queue?.getState().actions.clearBottomInset(owner), [queue, owner])
}
