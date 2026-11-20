import { act, fireEvent, render, screen } from "@testing-library/react-native"

import { SnackbarHost } from "@/shared/components/Snackbar"
import {
  createSnackbarQueue,
  type SnackbarQueue,
  SnackbarQueueProvider,
} from "@/shared/snackbar/snackbar-queue"
import { createTestQueryClient, TestProviders } from "@test/support/test-providers"

describe("SnackbarHost", () => {
  let queue: SnackbarQueue

  beforeEach(() => {
    jest.useFakeTimers()
    queue = createSnackbarQueue()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  async function renderHost() {
    await render(
      <TestProviders queryClient={createTestQueryClient()}>
        <SnackbarQueueProvider queue={queue}>
          <SnackbarHost />
        </SnackbarQueueProvider>
      </TestProviders>,
    )
  }

  it("mostra o aviso da vez e tira da fila quando o tempo acaba", async () => {
    await renderHost()

    await act(() => queue.getState().actions.show({ text: "Nota salva" }))
    expect(screen.getByText("Nota salva")).toBeOnTheScreen()

    await act(async () => {
      await jest.runAllTimersAsync()
    })
    expect(queue.getState().queue).toHaveLength(0)
  })

  it("roda a ação e tira o aviso da fila", async () => {
    const undone: string[] = []
    await renderHost()
    await act(() =>
      queue.getState().actions.show({
        text: "Nota apagada",
        action: { text: "Desfazer", onPress: () => undone.push("nota") },
      }),
    )

    await fireEvent.press(screen.getByText("Desfazer"))

    expect(undone).toEqual(["nota"])
    expect(queue.getState().queue).toHaveLength(0)
  })
})
