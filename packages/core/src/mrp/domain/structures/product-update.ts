import type { Product } from '#mrp/domain/entities/product.ts'

export type ProductUpdate = Partial<
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
  >
>
