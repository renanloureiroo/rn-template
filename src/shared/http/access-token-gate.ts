/** O token com que um pedido saiu e a renovação que ele já conhecia. */
export interface IssuedAccessToken {
  readonly token: string | null
  readonly generation: number
}

export interface AccessTokenGateOptions {
  /** O token da sessão; `null` sem sessão. */
  readonly accessToken: () => Promise<string | null>
  /**
   * Renova o token que `accessToken` devolve e responde com o novo; `null` quando não há sessão
   * para renovar. Não pode passar pelo cliente que usa este semáforo.
   */
  readonly refreshAccessToken?: () => Promise<string | null>
  /**
   * Avisado uma vez por renovação quando ela não traz token: a sessão acabou e o 401 vai subir.
   */
  readonly onSessionEnded?: () => void
}

interface Waiting {
  readonly resolve: (token: string | null) => void
  readonly reject: (error: unknown) => void
}

/**
 * Semáforo do token da sessão. O primeiro pedido recusado com 401 liga o semáforo e renova o
 * token; quem chega enquanto ele está ligado (pedido novo ou outro 401) entra na fila. Ao fim da
 * renovação, o pedido que a disparou é refeito primeiro e, em seguida, a fila é liberada com o
 * token novo. Nenhum pedido fica sem resposta: quando a renovação falha, a fila inteira recebe a
 * mesma falha.
 */
export class AccessTokenGate {
  private renewing = false
  private generation = 0
  private readonly waiting: Waiting[] = []

  constructor(private readonly options: AccessTokenGateOptions) {}

  /** O token para um pedido que vai sair; com o semáforo ligado, espera na fila. */
  async acquire(): Promise<IssuedAccessToken> {
    if (this.renewing) {
      const renewed = await this.wait().catch(() => null)
      if (renewed !== null) {
        return { token: renewed, generation: this.generation }
      }
    }
    const generation = this.generation
    return { token: await this.options.accessToken(), generation }
  }

  /**
   * Refaz com `repeat` o pedido recusado com 401 enquanto levava `rejected`. O pedido recusado com
   * um token que já foi renovado é refeito com o atual, sem renovar de novo. Devolve `null` quando
   * não há como refazer: o pedido saiu sem token, não há função de renovação ou a sessão acabou
   * (avisada por `onSessionEnded`).
   */
  async retry<T>(
    rejected: IssuedAccessToken,
    repeat: (token: string) => Promise<T>,
  ): Promise<T | null> {
    const refresh = this.options.refreshAccessToken
    if (rejected.token === null || refresh === undefined) {
      return null
    }
    if (this.renewing) {
      return repeatWith(await this.wait(), repeat)
    }
    if (rejected.generation !== this.generation) {
      return repeatWith(await this.options.accessToken(), repeat)
    }
    this.renewing = true
    this.generation += 1
    let renewed: string | null
    try {
      renewed = await refresh()
    } catch (error) {
      this.release((waiting) => waiting.reject(error))
      throw error
    }
    if (renewed === null) {
      this.options.onSessionEnded?.()
    }
    const repeated = repeatWith(renewed, repeat)
    this.release((waiting) => waiting.resolve(renewed))
    return repeated
  }

  private wait(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject })
    })
  }

  private release(settle: (waiting: Waiting) => void): void {
    this.renewing = false
    for (const waiting of this.waiting.splice(0)) {
      settle(waiting)
    }
  }
}

function repeatWith<T>(
  token: string | null,
  repeat: (token: string) => Promise<T>,
): Promise<T | null> {
  return token === null ? Promise.resolve(null) : repeat(token)
}
