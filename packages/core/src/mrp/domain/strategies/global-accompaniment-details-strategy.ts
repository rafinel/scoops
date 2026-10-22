import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { GlobalAccompanimentDetails } from '#mrp/domain/structures/global-accompaniment-details.ts'
import { AccompanimentCostSourceStrategy } from '#mrp/domain/strategies/accompaniment-cost-source-strategy.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export type GlobalAccompanimentDetailsInput = {
  readonly accompanimentProduct: Product
  readonly brands: readonly Brand[]
  /** Present only when the accompaniment product is global. */
  readonly shared?: {
    readonly global: GlobalAccompaniment
    readonly accompanimentType: AccompanimentType
  }
}

export class GlobalAccompanimentDetailsStrategy
  implements
    BusinessRuleStrategy<GlobalAccompanimentDetailsInput, GlobalAccompanimentDetails>
{
  constructor(
    private readonly accompanimentCostSource = new AccompanimentCostSourceStrategy(),
  ) {}

  execute({
    accompanimentProduct,
    brands,
    shared,
  }: GlobalAccompanimentDetailsInput): GlobalAccompanimentDetails {
    const details = {
      accompanimentProductId: accompanimentProduct.id,
      accompanimentProductName: accompanimentProduct.name,
      isGlobal: shared !== undefined,
      unit: accompanimentProduct.unit,
      salePrice: accompanimentProduct.accompanimentPrice ?? null,
    }
    if (!shared) return details

    return {
      ...details,
      salePrice: shared.global.accompanimentPrice ?? null,
      globalAccompanimentId: shared.global.id,
      accompanimentTypeId: shared.accompanimentType.id,
      accompanimentTypeName: shared.accompanimentType.name,
      quantityPerPortion: shared.global.quantityPerPortion,
      ...this.accompanimentCostSource.execute({
        product: accompanimentProduct,
        brands,
        quantityPerPortion: shared.global.quantityPerPortion,
      }),
    }
  }
}
