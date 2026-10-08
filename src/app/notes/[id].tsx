import { useLocalSearchParams } from "expo-router"

import { NoteDetailScreen } from "@/features/notes/views/NoteDetailScreen"

export default function NoteDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <NoteDetailScreen noteId={id} />
}
