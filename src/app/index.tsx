import { useRouter } from "expo-router"

import { NoteListScreen } from "@/features/notes/views/NoteListScreen"

export default function NotesRoute() {
  const router = useRouter()
  return (
    <NoteListScreen
      onOpenNote={(id) => router.push({ pathname: "/notes/[id]", params: { id } })}
      onCreateNote={() => router.push("/notes/new")}
    />
  )
}
