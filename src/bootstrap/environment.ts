export const NotesDataSource = {
  LOCAL: "local",
  REMOTE: "remote",
} as const

export type NotesDataSource = (typeof NotesDataSource)[keyof typeof NotesDataSource]

export interface Environment {
  readonly apiUrl: string
  readonly notesDataSource: NotesDataSource
}

// Variáveis EXPO_PUBLIC_* são embutidas no bundle em tempo de build e só quando acessadas de
// forma estática (process.env.EXPO_PUBLIC_X). Por isso a fonte padrão lista cada uma pelo nome.
// Tudo aqui é público: segredo nunca entra no app.
export interface EnvironmentSource {
  readonly EXPO_PUBLIC_API_URL?: string
  readonly EXPO_PUBLIC_NOTES_DATA_SOURCE?: string
}

const DEFAULT_SOURCE: EnvironmentSource = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_NOTES_DATA_SOURCE: process.env.EXPO_PUBLIC_NOTES_DATA_SOURCE,
}

export function loadEnvironment(source: EnvironmentSource = DEFAULT_SOURCE): Environment {
  return {
    apiUrl: source.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api",
    notesDataSource: notesDataSourceOf(source.EXPO_PUBLIC_NOTES_DATA_SOURCE),
  }
}

function notesDataSourceOf(value: string | undefined): NotesDataSource {
  if (value === undefined || value === "") {
    return NotesDataSource.LOCAL
  }
  const known = Object.values(NotesDataSource) as string[]
  if (!known.includes(value)) {
    throw new Error(`EXPO_PUBLIC_NOTES_DATA_SOURCE inválida: ${value} (use ${known.join(" ou ")})`)
  }
  return value as NotesDataSource
}
