import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import type {
  OrderPreviewFacts,
  OrderPreviewInput,
} from '@scoops/core/pdv/domain/structures'
import type { OrderPreviewTokenService } from '@scoops/core/pdv/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { EnvProvider } from '@/shared/provision/env/env-provider'

const TOKEN_VERSION = 1
const TOKEN_TTL_MS = 10 * 60 * 1000

type PreviewTokenClaims = {
  readonly version: number
  readonly establishmentId: string
  readonly inputDigest: string
  readonly factsDigest: string
  readonly facts: OrderPreviewFacts
  readonly issuedAt: number
  readonly expiresAt: number
}

@Injectable()
export class NodePreviewTokenService implements OrderPreviewTokenService {
  private readonly secret: string

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    this.secret = envProvider.get('SCOOPS_PDV_PREVIEW_TOKEN_SECRET')
  }

  issue(input: OrderPreviewInput, establishmentId: string, facts: OrderPreviewFacts) {
    const issuedAt = Date.now()
    const claims: PreviewTokenClaims = {
      version: TOKEN_VERSION,
      establishmentId,
      inputDigest: this.digest(this.canonicalizeInput(input)),
      factsDigest: this.digest(this.canonicalizeFacts(facts)),
      facts,
      issuedAt,
      expiresAt: issuedAt + TOKEN_TTL_MS,
    }
    const encodedClaims = this.encode(JSON.stringify(claims))
    const signature = this.sign(encodedClaims)
    return `${encodedClaims}.${signature}`
  }

  verify(
    token: string,
    input: OrderPreviewInput,
    establishmentId: string,
    facts: OrderPreviewFacts,
  ): 'valid' | 'stale' | 'invalid' {
    const claims = this.readClaims(token)
    if (!claims) return 'invalid'
    if (
      claims.version !== TOKEN_VERSION ||
      claims.establishmentId !== establishmentId ||
      !Number.isSafeInteger(claims.expiresAt) ||
      claims.expiresAt <= Date.now()
    )
      return 'invalid'

    const inputDigest = this.digest(this.canonicalizeInput(input))
    if (!this.equalDigest(claims.inputDigest, inputDigest)) return 'invalid'

    const factsDigest = this.digest(this.canonicalizeFacts(facts))
    return this.equalDigest(claims.factsDigest, factsDigest) ? 'valid' : 'stale'
  }

  getFacts(token: string): OrderPreviewFacts | undefined {
    const claims = this.readClaims(token)
    if (!claims || claims.expiresAt <= Date.now()) return undefined
    return claims.facts
  }

  private readClaims(token: string): PreviewTokenClaims | undefined {
    try {
      const [encodedClaims, encodedSignature, ...extra] = token.split('.')
      if (!encodedClaims || !encodedSignature || extra.length > 0) return undefined
      const expectedSignature = this.sign(encodedClaims)
      if (!this.equalDigest(encodedSignature, expectedSignature)) return undefined
      const claims = JSON.parse(this.decode(encodedClaims)) as unknown
      if (!this.isClaims(claims)) return undefined
      return claims
    } catch {
      return undefined
    }
  }

  private isClaims(value: unknown): value is PreviewTokenClaims {
    if (!value || typeof value !== 'object') return false
    const claims = value as Record<string, unknown>
    return (
      typeof claims.version === 'number' &&
      typeof claims.establishmentId === 'string' &&
      typeof claims.inputDigest === 'string' &&
      typeof claims.factsDigest === 'string' &&
      typeof claims.facts === 'object' &&
      claims.facts !== null &&
      typeof claims.issuedAt === 'number' &&
      typeof claims.expiresAt === 'number'
    )
  }

  private canonicalizeInput(input: OrderPreviewInput): string {
    const lines = [...input.lines]
      .map((line) =>
        line.kind === 'portion'
          ? {
              productId: line.productId,
              kind: line.kind,
              quantity: line.quantity,
              sizeId: line.sizeId,
              accompanimentIds: [...line.accompanimentIds].sort(),
            }
          : {
              productId: line.productId,
              kind: line.kind,
              quantity: line.quantity,
              ...(line.brandId ? { brandId: line.brandId } : {}),
            },
      )
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
    return JSON.stringify({ channelId: input.channelId ?? null, lines })
  }

  private canonicalizeFacts(facts: OrderPreviewFacts): string {
    return JSON.stringify({
      cart: {
        ...facts.cart,
        lines: [...facts.cart.lines]
          .map((line) => ({
            ...line,
            accompanimentIds:
              'accompanimentIds' in line ? [...line.accompanimentIds].sort() : undefined,
            consumptions: [...line.consumptions].sort((left, right) =>
              JSON.stringify(left).localeCompare(JSON.stringify(right)),
            ),
          }))
          .sort(
            (left, right) =>
              left.productId.localeCompare(right.productId) ||
              left.kind.localeCompare(right.kind),
          ),
        discounts: [...facts.cart.discounts].sort((left, right) =>
          left.discountId.localeCompare(right.discountId),
        ),
      },
      channel: facts.channel ?? null,
    })
  }

  private digest(value: string): string {
    return createHash('sha256').update(value).digest('base64url')
  }

  private sign(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url')
  }

  private encode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url')
  }

  private decode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8')
  }

  private equalDigest(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    return (
      leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
    )
  }
}
