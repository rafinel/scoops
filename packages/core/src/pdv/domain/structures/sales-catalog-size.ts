import type { SalesCatalogAccompaniment } from '#pdv/domain/structures/sales-catalog-accompaniment.ts'

export type SalesCatalogSize = {
  readonly sizeId: string
  readonly name: string
  readonly quantity: number
  readonly basePrice: number
  readonly isActive: boolean
  readonly isAvailable: boolean
  readonly accompaniments: readonly SalesCatalogAccompaniment[]
}
