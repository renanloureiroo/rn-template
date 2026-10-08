import type { NativeStackScreenProps } from "@react-navigation/native-stack"

export type AppStackParamList = {
  NoteList: undefined
  NoteCreate: undefined
  NoteDetail: { id: string }
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>
