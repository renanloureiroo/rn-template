import { ViewStyle } from "react-native"

import { useNoteCreateViewModel } from "@/features/notes/view-models/use-note-create-view-model"
import { Button } from "@/shared/components/Button"
import { Screen } from "@/shared/components/Screen"
import { TextField } from "@/shared/components/TextField"
import { useAppTheme } from "@/shared/theme/context"
import type { ThemedStyle } from "@/shared/theme/types"

export interface NoteCreateScreenProps {
  onCreated: (noteId: string) => void
}

export function NoteCreateScreen({ onCreated }: NoteCreateScreenProps) {
  const { themed } = useAppTheme()
  const { title, maxLength, errorMessage, isSaving, changeTitle, submit } = useNoteCreateViewModel({
    onCreated,
  })

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)}>
      <TextField
        labelTx="notes:titleLabel"
        placeholderTx="notes:titlePlaceholder"
        defaultValue={title}
        onChangeText={changeTitle}
        onSubmitEditing={submit}
        maxLength={maxLength}
        status={errorMessage ? "error" : undefined}
        helper={errorMessage}
        helperTx={errorMessage ? undefined : "notes:titleHelper"}
        helperTxOptions={{ length: title.length, max: maxLength }}
        autoFocus
        testID="note-title-input"
      />

      <Button
        tx="notes:save"
        onPress={submit}
        disabled={isSaving}
        style={themed($save)}
        testID="note-save"
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $save: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  alignSelf: "flex-end",
})
