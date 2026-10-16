import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import type {
  OrderPreviewFacts,
  OrderPreviewInput,
} from '@scoops/core/pdv/domain/structures'
import type { OrderPreviewTokenService } from '@scoops/core/pdv/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { EnvProvider } from '@/shared/provision/env/env-provider'

const [LEGACY_TOKEN_VERSION, TOKEN_VERSION] = [1, 2]
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
    const [issuedAt, version] = [Date.now(), this.getTokenVersion(facts)]
    const claims: PreviewTokenClaims = {
      version,
      establishmentId,
      inputDigest: this.digest(this.canonicalizeInput(input)),
      factsDigest: this.digest(this.canonicalizeFacts(facts, version)),
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
      (claims.version !== LEGACY_TOKEN_VERSION && claims.version !== TOKEN_VERSION) ||
      claims.establishmentId !== establishmentId ||
      !Number.isSafeInteger(claims.expiresAt) ||
      claims.expiresAt <= Date.now() ||
      (claims.version === LEGACY_TOKEN_VERSION && this.hasSelectedAccompaniments(facts))
    )
      return 'invalid'

    if (!this.matches(claims.inputDigest, this.canonicalizeInput(input))) return 'invalid'

    const factsDigest = this.digest(this.canonicalizeFacts(facts, claims.version))
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

  private canonicalizeFacts(facts: OrderPreviewFacts, version: number): string {
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
      ...(version === TOKEN_VERSION
        ? {
            selectedAccompanimentPrices: [...(facts.selectedAccompanimentPrices ?? [])]
              .sort(
                (left, right) =>
                  left.productId.localeCompare(right.productId) ||
                  left.sizeId.localeCompare(right.sizeId) ||
                  left.accompanimentId.localeCompare(right.accompanimentId) ||
                  left.basePrice - right.basePrice,
              )
              .map(({ productId, sizeId, accompanimentId, basePrice }) => ({
                productId,
                sizeId,
                accompanimentId,
                basePrice,
              })),
          }
        : {}),
    })
  }

  private getTokenVersion(facts: OrderPreviewFacts): number {
    return this.hasSelectedAccompaniments(facts) ? TOKEN_VERSION : LEGACY_TOKEN_VERSION
  }

  private hasSelectedAccompaniments(facts: OrderPreviewFacts): boolean {
    return (
      facts.cart.lines.some(
        (line) => 'accompanimentIds' in line && line.accompanimentIds.length > 0,
      ) || Boolean(facts.selectedAccompanimentPrices?.length)
    )
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

  private matches(expectedDigest: string, value: string): boolean {
    return this.equalDigest(expectedDigest, this.digest(value))
  }
}
