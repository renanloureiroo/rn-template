import { ActivityIndicator, View, ViewStyle } from "react-native"

import { useNoteListViewModel } from "@/features/notes/view-models/use-note-list-view-model"
import { Button } from "@/shared/components/Button"
import { EmptyState } from "@/shared/components/EmptyState"
import { List, ListItem } from "@/shared/components/List"
import { Screen } from "@/shared/components/Screen"
import { translate } from "@/shared/i18n/translate"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

// A tela não conhece a navegação: recebe intenções como callbacks. Quem decide para onde ir é a
// rota (src/app no Expo Router, src/navigation no React Navigation).
export interface NoteListScreenProps {
  onOpenNote: (noteId: string) => void
  onCreateNote: () => void
}

export function NoteListScreen({ onOpenNote, onCreateNote }: NoteListScreenProps) {
  const { theme, themed } = useAppTheme()
  const { state, loadMore, refresh, retry } = useNoteListViewModel()

  if (state.status === "loading") {
    return (
      <Screen contentContainerStyle={$centered}>
        <ActivityIndicator color={theme.colors.tint} testID="notes-loading" />
      </Screen>
    )
  }

  if (state.status === "error") {
    return (
      <Screen contentContainerStyle={$centered}>
        <EmptyState
          heading={state.message}
          buttonTx="notes:retry"
          buttonOnPress={retry}
          testID="notes-error"
        />
      </Screen>
    )
  }

  if (state.status === "empty") {
    return (
      <Screen contentContainerStyle={$centered}>
        <EmptyState
          headingTx="notes:emptyHeading"
          contentTx="notes:emptyContent"
          buttonTx="notes:newNote"
          buttonOnPress={onCreateNote}
          testID="notes-empty"
        />
      </Screen>
    )
  }

  return (
    <Screen safeAreaEdges={["bottom"]}>
      <List testID="notes-list" onRefresh={refresh}>
        {state.notes.map((note) => (
          <ListItem
            key={note.id}
            text={note.title}
            supportingText={translate("notes:createdAt", { date: note.createdAt })}
            onPress={() => onOpenNote(note.id)}
            testID={`note-${note.id}`}
          />
        ))}
      </List>

      <View style={themed($actions)}>
        {state.hasMore && (
          <Button
            preset="outlined"
            tx="notes:loadMore"
            disabled={state.isLoadingMore}
            onPress={loadMore}
            testID="notes-load-more"
          />
        )}
        <Button tx="notes:newNote" onPress={onCreateNote} testID="notes-create" />
      </View>
    </Screen>
  )
}

const $centered: ViewStyle = { flex: 1, justifyContent: "center" }

const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: spacing.sm,
  padding: spacing.md,
})
