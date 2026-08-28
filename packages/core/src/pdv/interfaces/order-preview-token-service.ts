import type { OrderPreviewFacts } from '#pdv/domain/structures/order-preview.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'

type OrderPreviewTokenVerification = 'valid' | 'stale' | 'invalid'

export interface OrderPreviewTokenService {
  issue(
    input: OrderPreviewInput,
    establishmentId: string,
    facts: OrderPreviewFacts,
  ): string
  verify(
    token: string,
    input: OrderPreviewInput,
    establishmentId: string,
    facts: OrderPreviewFacts,
  ): OrderPreviewTokenVerification
  getFacts(token: string): OrderPreviewFacts | undefined
}
