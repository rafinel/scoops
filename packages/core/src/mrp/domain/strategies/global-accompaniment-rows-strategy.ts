import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { ProductAccompanimentCreate } from '#mrp/domain/structures/product-accompaniment-create.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export type GlobalAccompanimentRowsInput = {
  readonly globals: readonly GlobalAccompaniment[]
  readonly portionProductIds: readonly string[]
  readonly existingPairs: readonly {
    readonly productId: string
    readonly accompanimentProductId: string
  }[]
}

export class GlobalAccompanimentRowsStrategy
  implements
    BusinessRuleStrategy<GlobalAccompanimentRowsInput, ProductAccompanimentCreate[]>
{
  execute({
    globals,
    portionProductIds,
    existingPairs,
  }: GlobalAccompanimentRowsInput): ProductAccompanimentCreate[] {
    const existing = new Set(
      existingPairs.map((pair) =>
        this.pairKey(pair.productId, pair.accompanimentProductId),
      ),
    )

    return portionProductIds.flatMap((productId) =>
      globals
        .filter(
          (global) =>
            !existing.has(this.pairKey(productId, global.accompanimentProductId)),
        )
        .map((global) => this.toRow(productId, global)),
    )
  }

  private toRow(
    productId: string,
    global: GlobalAccompaniment,
  ): ProductAccompanimentCreate {
    return {
      establishmentId: global.establishmentId,
      productId,
      accompanimentProductId: global.accompanimentProductId,
      accompanimentTypeId: global.accompanimentTypeId,
      quantityPerPortion: global.quantityPerPortion,
      globalAccompanimentId: global.id,
    }
  }

  private pairKey(productId: string, accompanimentProductId: string): string {
    return `${productId}:${accompanimentProductId}`
  }
}
