// Contrato do armazenamento chave-valor do dispositivo. O MMKV implementa em produção e um fake
// em memória implementa nos testes; quem usa recebe a implementação por parâmetro.
export interface KeyValueStorage {
  getString(key: string): string | null
  setString(key: string, value: string): void
  remove(key: string): void
}
