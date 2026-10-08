import { loadEnvironment, NotesDataSource } from "@/bootstrap/environment"

describe("loadEnvironment", () => {
  it("usa armazenamento local e a API local por padrão", () => {
    expect(loadEnvironment({})).toEqual({
      apiUrl: "http://localhost:8080/api",
      notesDataSource: NotesDataSource.LOCAL,
    })
  })

  it("lê a URL da API e a fonte de dados das variáveis públicas", () => {
    const environment = loadEnvironment({
      EXPO_PUBLIC_API_URL: "https://api.example.com/api",
      EXPO_PUBLIC_NOTES_DATA_SOURCE: "remote",
    })

    expect(environment).toEqual({
      apiUrl: "https://api.example.com/api",
      notesDataSource: NotesDataSource.REMOTE,
    })
  })

  it("rejeita fonte de dados desconhecida", () => {
    expect(() => loadEnvironment({ EXPO_PUBLIC_NOTES_DATA_SOURCE: "graphql" })).toThrow(
      "EXPO_PUBLIC_NOTES_DATA_SOURCE inválida: graphql",
    )
  })
})
