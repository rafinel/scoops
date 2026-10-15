import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { OrderPreviewAccompanimentPrice } from '#pdv/domain/structures/order-preview.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { SalesCatalogSize } from '#pdv/domain/structures/sales-catalog-size.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type SnapshotInput = {
  readonly cart: Cart
  readonly products: readonly SalesCatalogProduct[]
}

type AccompanimentPriceEntry = {
  readonly key: string
  readonly price: OrderPreviewAccompanimentPrice
}

export class OrderPreviewAccompanimentPriceSnapshotStrategy
  implements
    BusinessRuleStrategy<SnapshotInput, readonly OrderPreviewAccompanimentPrice[]>
{
  execute({ cart, products }: SnapshotInput): readonly OrderPreviewAccompanimentPrice[] {
    const productsById = new Map(products.map((product) => [product.productId, product]))
    const prices = this.collectPrices(cart, productsById)
    return [...prices.values()].sort(comparePrices)
  }

  private collectPrices(
    cart: Cart,
    productsById: ReadonlyMap<string, SalesCatalogProduct>,
  ): Map<string, OrderPreviewAccompanimentPrice> {
    const prices = new Map<string, OrderPreviewAccompanimentPrice>()
    for (const line of cart.lines) this.collectLinePrices(line, productsById, prices)
    return prices
  }

  private collectLinePrices(
    line: Cart['lines'][number],
    productsById: ReadonlyMap<string, SalesCatalogProduct>,
    prices: Map<string, OrderPreviewAccompanimentPrice>,
  ): void {
    for (const { key, price } of this.getLinePrices(line, productsById)) {
      prices.set(key, price)
    }
  }

  private getLinePrices(
    line: Cart['lines'][number],
    productsById: ReadonlyMap<string, SalesCatalogProduct>,
  ): readonly AccompanimentPriceEntry[] {
    if (line.kind !== 'portion') return []
    const size = this.findLineSize(line, productsById)
    return size ? this.getPricesForLine(line, size) : []
  }

  private findLineSize(
    line: Cart['lines'][number],
    productsById: ReadonlyMap<string, SalesCatalogProduct>,
  ): SalesCatalogSize | undefined {
    return productsById
      .get(line.productId)
      ?.sizes.find((candidate) => candidate.sizeId === line.sizeId)
  }

  private getPricesForLine(
    line: Cart['lines'][number],
    size: SalesCatalogSize,
  ): readonly AccompanimentPriceEntry[] {
    return line.accompanimentIds
      .map((accompanimentId) => this.getLinePrice(line, size, accompanimentId))
      .filter((entry): entry is AccompanimentPriceEntry => entry !== undefined)
  }

  private getLinePrice(
    line: Cart['lines'][number],
    size: SalesCatalogSize,
    accompanimentId: string,
  ): AccompanimentPriceEntry | undefined {
    const accompaniment = this.findLineAccompaniment(size, accompanimentId)
    if (!accompaniment) return undefined

    const price = this.createPriceSnapshot(line, size, accompanimentId, accompaniment)
    return { key: this.getPriceKey(price), price }
  }

  private findLineAccompaniment(
    size: SalesCatalogSize,
    accompanimentId: string,
  ): SalesCatalogSize['accompaniments'][number] | undefined {
    return size.accompaniments.find(
      (candidate) => candidate.accompanimentId === accompanimentId,
    )
  }

  private createPriceSnapshot(
    line: Cart['lines'][number],
    size: SalesCatalogSize,
    accompanimentId: string,
    accompaniment: SalesCatalogSize['accompaniments'][number],
  ): OrderPreviewAccompanimentPrice {
    return {
      productId: line.productId,
      sizeId: size.sizeId,
      accompanimentId,
      name: accompaniment.name,
      basePrice: accompaniment.basePrice,
    }
  }

  private getPriceKey(price: OrderPreviewAccompanimentPrice): string {
    return JSON.stringify([price.productId, price.sizeId, price.accompanimentId])
  }
}

function comparePrices(
  left: OrderPreviewAccompanimentPrice,
  right: OrderPreviewAccompanimentPrice,
): number {
  return (
    left.productId.localeCompare(right.productId) ||
    left.sizeId.localeCompare(right.sizeId) ||
    left.accompanimentId.localeCompare(right.accompanimentId)
  )
}
