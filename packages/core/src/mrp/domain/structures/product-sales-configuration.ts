import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'

export type ProductSalesConfiguration = {
  readonly establishmentId: string
  readonly productId: string
  readonly name: string
  readonly categories: readonly ProductCategory[]
  readonly status: ProductStatus
  readonly stockControl: ProductStockControl
  readonly sizes: readonly {
    sizeId: string
    name: string
    price: number
    isActive: boolean
    accompaniments: readonly {
      accompanimentId: string
      productId: string
      name: string
      type: string
      basePrice: number
      isActive: boolean
    }[]
  }[]
  readonly resaleConfigurations: readonly {
    brandId?: string
    brandName?: string
    price: number
    isActive: boolean
  }[]
  readonly updatedAt: Date
}
