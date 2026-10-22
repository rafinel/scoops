import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { AccompanimentPortionDetails } from '#mrp/domain/structures/accompaniment-portion-details.ts'
import { AccompanimentCostSourceStrategy } from '#mrp/domain/strategies/accompaniment-cost-source-strategy.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export type AccompanimentPortionDetailsInput = {
  readonly link: ProductAccompaniment
  readonly portion: Product
  readonly accompanimentProduct: Product
  readonly accompanimentType: AccompanimentType
  readonly brands: readonly Brand[]
  /** The global `link` references; its price is the row's sale price. */
  readonly global?: GlobalAccompaniment
  /** Every row of the accompaniment product, including `link` itself. */
  readonly accompanimentLinksCount: number
}

export class AccompanimentPortionDetailsStrategy
  implements
    BusinessRuleStrategy<AccompanimentPortionDetailsInput, AccompanimentPortionDetails>
{
  constructor(
    private readonly accompanimentCostSource = new AccompanimentCostSourceStrategy(),
  ) {}

  execute({
    link,
    portion,
    accompanimentProduct,
    accompanimentType,
    brands,
    global,
    accompanimentLinksCount,
  }: AccompanimentPortionDetailsInput): AccompanimentPortionDetails {
    const isGlobal = link.globalAccompanimentId !== undefined
    return {
      id: link.id,
      accompanimentProductId: accompanimentProduct.id,
      accompanimentProductName: accompanimentProduct.name,
      accompanimentTypeId: accompanimentType.id,
      accompanimentTypeName: accompanimentType.name,
      unit: accompanimentProduct.unit,
      quantityPerPortion: link.quantityPerPortion,
      salePrice:
        (isGlobal ? global?.accompanimentPrice : link.accompanimentPrice) ?? null,
      isGlobal,
      hasOtherPortionLinks: !isGlobal && accompanimentLinksCount > 1,
      ...this.accompanimentCostSource.execute({
        product: accompanimentProduct,
        brands,
        quantityPerPortion: link.quantityPerPortion,
      }),
      portionProductId: portion.id,
      portionProductName: portion.name,
    }
  }
}
