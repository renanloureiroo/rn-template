type ScriptedRenewal = { kind: "token"; token: string | null } | { kind: "failure"; error: Error }

export class FakeSessionTokens {
  refreshes = 0
  private current: string | null
  private readonly script: ScriptedRenewal[] = []
  private gate: Promise<void> | null = null
  private openGate: (() => void) | null = null

  constructor(token: string | null) {
    this.current = token
  }

  readonly accessToken = async (): Promise<string | null> => this.current

  readonly refreshAccessToken = async (): Promise<string | null> => {
    this.refreshes += 1
    const next = this.script.shift()
    if (next === undefined) {
      throw new Error("FakeSessionTokens sem renovação roteirizada")
    }
    if (this.gate !== null) {
      await this.gate
    }
    if (next.kind === "failure") {
      throw next.error
    }
    this.current = next.token
    return next.token
  }

  renewTo(token: string | null): this {
    this.script.push({ kind: "token", token })
    return this
  }

  failRenewalWith(error: Error): this {
    this.script.push({ kind: "failure", error })
    return this
  }

  hold(): this {
    this.gate = new Promise((resolve) => {
      this.openGate = resolve
    })
    return this
  }

  release(): void {
    this.openGate?.()
    this.gate = null
    this.openGate = null
  }
}
