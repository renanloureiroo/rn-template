import type { HapticEvent, Haptics } from "@/shared/haptics/haptics"

// Haptics de teste: guarda os eventos tocados para o teste afirmar o que a pessoa sentiria.
export class RecordingHaptics implements Haptics {
  played: HapticEvent[] = []

  play(event: HapticEvent): void {
    this.played.push(event)
  }
}

// A instância ligada em test/setup.ts antes de cada teste.
export const testHaptics = new RecordingHaptics()
