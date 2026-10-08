import { ActivityIndicator, TextStyle, ViewStyle } from "react-native"

import { useNoteDetailViewModel } from "@/features/notes/view-models/use-note-detail-view-model"
import { EmptyState } from "@/shared/components/EmptyState"
import { Screen } from "@/shared/components/Screen"
import { Text } from "@/shared/components/Text"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

export interface NoteDetailScreenProps {
  noteId: string
}

export function NoteDetailScreen({ noteId }: NoteDetailScreenProps) {
  const { theme, themed } = useAppTheme()
  const { state } = useNoteDetailViewModel(noteId)

  if (state.status === "loading") {
    return (
      <Screen contentContainerStyle={$centered}>
        <ActivityIndicator color={theme.colors.tint} testID="note-loading" />
      </Screen>
    )
  }

  if (state.status === "error") {
    return (
      <Screen contentContainerStyle={$centered}>
        <EmptyState heading={state.message} testID="note-error" />
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)}>
      <Text preset="heading" text={state.title} testID="note-title" />
      <Text
        tx="notes:createdAt"
        txOptions={{ date: state.createdAt }}
        style={themed($createdAt)}
        testID="note-created-at"
      />
    </Screen>
  )
}

const $centered: ViewStyle = { flex: 1, justifyContent: "center" }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $createdAt: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
})
