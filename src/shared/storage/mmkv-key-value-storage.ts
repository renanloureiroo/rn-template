import { createMMKV, type MMKV } from "react-native-mmkv"

import type { KeyValueStorage } from "@/shared/storage/key-value-storage"

// Implementação MMKV do KeyValueStorage. Uma instância por app: a preferência de tema, o cache do
// TanStack Query e os repositórios locais das features compartilham o mesmo arquivo, com chaves
// prefixadas por quem as usa.
export class MmkvKeyValueStorage implements KeyValueStorage {
  constructor(readonly mmkv: MMKV = createMMKV()) {}

  getString(key: string): string | null {
    return this.mmkv.getString(key) ?? null
  }

  setString(key: string, value: string): void {
    this.mmkv.set(key, value)
  }

  remove(key: string): void {
    this.mmkv.remove(key)
  }
}
