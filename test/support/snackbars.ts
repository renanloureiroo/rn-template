import type { QueuedSnackbar, SnackbarQueue } from "@/shared/snackbar/snackbar-queue"

export function currentSnackbar(queue: SnackbarQueue): QueuedSnackbar | undefined {
  return queue.getState().queue[0]
}

export function pressSnackbarAction(queue: SnackbarQueue): void {
  const current = currentSnackbar(queue)
  if (current?.action === undefined) throw new Error("O aviso da vez não tem ação")
  current.action.onPress()
  queue.getState().actions.dismiss(current.id)
}
