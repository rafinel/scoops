import type { Product } from '#mrp/domain/entities/product.ts'

export type ProductUpdate = Partial<
  Omit<
    Pick<
      Product,
      | 'name'
      | 'unit'
      | 'categories'
      | 'stockControl'
      | 'status'
      | 'allowNegativeStock'
      | 'idealStock'
      | 'currentUnitCost'
      | 'internalNotes'
    >,
    'idealStock' | 'internalNotes'
  > & {
    idealStock?: number | null
    internalNotes?: string | null
  }
>
