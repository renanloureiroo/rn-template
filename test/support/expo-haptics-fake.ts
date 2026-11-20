export enum ImpactFeedbackStyle {
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Soft = "soft",
  Rigid = "rigid",
}

export enum NotificationFeedbackType {
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export enum AndroidHaptics {
  Confirm = "confirm",
  Reject = "reject",
  Long_Press = "long-press",
  Segment_Tick = "segment-tick",
}

export const hapticsFake = {
  played: [] as string[],
  failNext: false,
  reset(): void {
    this.played = []
    this.failNext = false
  },
}

function record(call: string): Promise<void> {
  hapticsFake.played.push(call)
  if (!hapticsFake.failNext) return Promise.resolve()
  hapticsFake.failNext = false
  return Promise.reject(new Error("sem motor de vibração"))
}

export function selectionAsync(): Promise<void> {
  return record("selection")
}

export function impactAsync(
  style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium,
): Promise<void> {
  return record(`impact:${style}`)
}

export function notificationAsync(
  type: NotificationFeedbackType = NotificationFeedbackType.Success,
): Promise<void> {
  return record(`notification:${type}`)
}

export function performAndroidHapticsAsync(type: AndroidHaptics): Promise<void> {
  return record(`android:${type}`)
}
