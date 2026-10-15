import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { OrderPreviewAccompanimentPrice } from '#pdv/domain/structures/order-preview.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type SnapshotInput = {
  readonly cart: Cart
  readonly products: readonly SalesCatalogProduct[]
}

export class OrderPreviewAccompanimentPriceSnapshotStrategy
  implements
    BusinessRuleStrategy<SnapshotInput, readonly OrderPreviewAccompanimentPrice[]>
{
  execute({ cart, products }: SnapshotInput): readonly OrderPreviewAccompanimentPrice[] {
    const productsById = new Map(products.map((product) => [product.productId, product]))
    const prices = new Map<string, OrderPreviewAccompanimentPrice>()

    for (const line of cart.lines) {
      const sizeId = line.kind === 'portion' ? line.sizeId : undefined
      if (!sizeId) continue
      const size = productsById
        .get(line.productId)
        ?.sizes.find((candidate) => candidate.sizeId === sizeId)
      if (!size) continue

      for (const accompanimentId of line.accompanimentIds) {
        const accompaniment = size.accompaniments.find(
          (candidate) => candidate.accompanimentId === accompanimentId,
        )
        if (!accompaniment) continue

        const price: OrderPreviewAccompanimentPrice = {
          productId: line.productId,
          sizeId,
          accompanimentId,
          name: accompaniment.name,
          basePrice: accompaniment.basePrice,
        }
        prices.set(JSON.stringify([line.productId, sizeId, accompanimentId]), price)
      }
    }

    return [...prices.values()].sort(
      (left, right) =>
        left.productId.localeCompare(right.productId) ||
        left.sizeId.localeCompare(right.sizeId) ||
        left.accompanimentId.localeCompare(right.accompanimentId),
    )
  }
}
