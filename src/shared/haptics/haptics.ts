/**
 * O que a pessoa sente; cada sistema escolhe o efeito equivalente.
 *
 * - `selection`: a escolha mudou (aba, chip, dia, dígito do código, item de menu);
 * - `longPress`: segurar abriu outras ações;
 * - `impact`: um gesto concluiu a ação (swipe da linha);
 * - `warning`: uma confirmação de algo sem volta apareceu;
 * - `error`: o que a pessoa mandou não foi aceito.
 */
export type HapticEvent = "selection" | "longPress" | "impact" | "warning" | "error"

/**
 * Feedback tátil. Nunca falha: sem motor de vibração ou com a vibração do sistema desligada,
 * não faz nada.
 */
export interface Haptics {
  play(event: HapticEvent): void
}

let current: Haptics | null = null

export function provideHaptics(haptics: Haptics): void {
  current = haptics
}

export function haptics(): Haptics {
  if (current === null) {
    throw new Error("haptics precisa ser ligado pelo bootstrap")
  }
  return current
}
