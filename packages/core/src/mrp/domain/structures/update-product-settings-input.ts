import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'

export type UpdateProductSettingsInput = {
  name?: string
  idealStock?: number | null
  status?: ProductStatus
  allowNegativeStock?: boolean
  internalNotes?: string | null
  expectedUpdatedAt: Date
}
