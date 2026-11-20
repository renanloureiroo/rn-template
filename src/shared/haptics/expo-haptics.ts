import { Platform } from "react-native"
import {
  AndroidHaptics,
  ImpactFeedbackStyle,
  impactAsync,
  NotificationFeedbackType,
  notificationAsync,
  performAndroidHapticsAsync,
  selectionAsync,
} from "expo-haptics"

import type { HapticEvent, Haptics } from "@/shared/haptics/haptics"

type HapticPlatform = "ios" | "android"

const IOS: Record<HapticEvent, () => Promise<void>> = {
  selection: () => selectionAsync(),
  longPress: () => impactAsync(ImpactFeedbackStyle.Medium),
  impact: () => impactAsync(ImpactFeedbackStyle.Light),
  warning: () => notificationAsync(NotificationFeedbackType.Warning),
  error: () => notificationAsync(NotificationFeedbackType.Error),
}

const ANDROID: Record<HapticEvent, AndroidHaptics> = {
  selection: AndroidHaptics.Segment_Tick,
  longPress: AndroidHaptics.Long_Press,
  impact: AndroidHaptics.Confirm,
  warning: AndroidHaptics.Reject,
  error: AndroidHaptics.Reject,
}

/**
 * `Haptics` sobre o `expo-haptics`. No iOS, os geradores do UIKit; no Android, o motor de toque
 * do sistema (`performHapticFeedback`), que respeita a configuração do aparelho.
 */
export class ExpoHaptics implements Haptics {
  constructor(
    private readonly platform: HapticPlatform = Platform.OS === "android" ? "android" : "ios",
  ) {}

  play(event: HapticEvent): void {
    const feedback =
      this.platform === "android" ? performAndroidHapticsAsync(ANDROID[event]) : IOS[event]()
    feedback.catch(() => {})
  }
}
