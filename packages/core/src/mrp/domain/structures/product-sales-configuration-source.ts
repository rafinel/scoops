import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'

export type ProductSalesConfigurationSource = {
  readonly product: Product
  readonly sizes: readonly ProductSize[]
  readonly links: readonly ProductAccompaniment[]
  readonly resaleConfigurations: readonly ResaleConfiguration[]
  readonly brands: readonly Brand[]
  readonly accompanimentProducts: readonly Product[]
  readonly accompanimentTypes: readonly AccompanimentType[]
  /** Globals referenced by `links` (a global row's price lives on the global). */
  readonly globals: readonly GlobalAccompaniment[]
}
