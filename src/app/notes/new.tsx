import { useRouter } from "expo-router"

import { NoteCreateScreen } from "@/features/notes/views/NoteCreateScreen"

export default function NewNoteRoute() {
  const router = useRouter()
  return (
    <NoteCreateScreen
      onCreated={(id) => router.replace({ pathname: "/notes/[id]", params: { id } })}
    />
  )
}
