import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'

export interface OrderRegistrationInput extends OrderPreviewInput {
  readonly idempotencyKey: string
  readonly previewToken: string
}
