import type { KeyValueStorage } from "@/shared/storage/key-value-storage"

export class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>()

  getString(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setString(key: string, value: string): void {
    this.values.set(key, value)
  }

  remove(key: string): void {
    this.values.delete(key)
  }

  keys(): string[] {
    return [...this.values.keys()]
  }
}
