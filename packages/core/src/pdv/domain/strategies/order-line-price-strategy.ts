import type { CartLine } from '#pdv/domain/structures/cart-line.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import type { OrderRegistrationShortage } from '#pdv/domain/structures/order-registration-shortage.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import { OrderMoneyRoundingStrategy } from '#pdv/domain/strategies/order-money-rounding-strategy.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type RegistrationLine = OrderPreviewInput['lines'][number]
type ProductSize = SalesCatalogProduct['sizes'][number]
type ProductBrand = SalesCatalogProduct['resaleBrands'][number]
type ProductAccompaniment = ProductSize['accompaniments'][number]

type LinePriceInput = {
  readonly inputLine: RegistrationLine
  readonly product: SalesCatalogProduct
  readonly channelPercentage: number
}

type LineConfiguration = {
  readonly size: ProductSize | undefined
  readonly brand: ProductBrand | undefined
  readonly selectedAccompaniments: readonly ProductAccompaniment[]
}

type LineBuild = {
  readonly line: CartLine
  readonly shortages: readonly OrderRegistrationShortage[]
}

export class OrderLinePriceStrategy
  implements BusinessRuleStrategy<LinePriceInput, LineBuild>
{
  private readonly money = new OrderMoneyRoundingStrategy()

  execute(input: LinePriceInput): LineBuild {
    const { inputLine, product, channelPercentage } = input
    const configuration = this.resolveConfiguration(inputLine, product)
    const baseUnitPrice = this.calculateBaseUnitPrice(inputLine, product, configuration)
    const finalUnitPrice = this.money.execute({
      amount: baseUnitPrice,
      percentage: channelPercentage,
    })

    return {
      line: this.createLine(
        inputLine,
        product,
        configuration,
        baseUnitPrice,
        finalUnitPrice,
      ),
      shortages: this.collectShortages(inputLine, product, configuration),
    }
  }

  private resolveConfiguration(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
  ): LineConfiguration {
    const size =
      inputLine.kind === 'portion'
        ? product.sizes.find((candidate) => candidate.sizeId === inputLine.sizeId)
        : undefined
    const brand =
      inputLine.kind === 'resale' && inputLine.brandId
        ? product.resaleBrands.find(
            (candidate) => candidate.brandId === inputLine.brandId,
          )
        : undefined

    return {
      size,
      brand,
      selectedAccompaniments:
        inputLine.kind === 'portion'
          ? (size?.accompaniments.filter((item) =>
              inputLine.accompanimentIds.includes(item.accompanimentId),
            ) ?? [])
          : [],
    }
  }

  private collectShortages(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): readonly OrderRegistrationShortage[] {
    return [
      ...this.collectProductShortages(inputLine, product, configuration),
      ...this.collectConfigurationShortages(inputLine, product, configuration),
    ]
  }

  private collectProductShortages(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): readonly OrderRegistrationShortage[] {
    const hasConfigurationAvailability =
      inputLine.kind === 'portion'
        ? Boolean(configuration.size)
        : Boolean(configuration.brand)
    if (product.isAvailable || hasConfigurationAvailability) return []

    return [
      {
        productId: product.productId,
        productName: product.name,
        unit: ProductUnit.Unit,
        requiredQuantity: inputLine.quantity,
        availableQuantity: product.availableQuantity ?? 0,
      },
    ]
  }

  private collectConfigurationShortages(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): readonly OrderRegistrationShortage[] {
    const shortages: OrderRegistrationShortage[] = []
    if (configuration.size && !configuration.size.isAvailable) {
      shortages.push({
        productId: product.productId,
        productName: product.name,
        unit: ProductUnit.Unit,
        requiredQuantity: configuration.size.quantity * inputLine.quantity,
        availableQuantity: configuration.size.availableQuantity ?? 0,
      })
    }
    if (configuration.brand && !configuration.brand.isAvailable) {
      shortages.push({
        productId: product.productId,
        productName: product.name,
        brandId: configuration.brand.brandId,
        brandName: configuration.brand.name,
        unit: ProductUnit.Unit,
        requiredQuantity: inputLine.quantity,
        availableQuantity: configuration.brand.availableQuantity ?? 0,
      })
    }

    shortages.push(
      ...this.collectAccompanimentShortages(inputLine.quantity, configuration),
    )
    return shortages
  }

  private collectAccompanimentShortages(
    quantity: number,
    configuration: LineConfiguration,
  ): readonly OrderRegistrationShortage[] {
    const shortages: OrderRegistrationShortage[] = []
    for (const accompaniment of configuration.selectedAccompaniments) {
      if (accompaniment.isAvailable) continue
      shortages.push({
        productId: accompaniment.productId ?? accompaniment.accompanimentId,
        productName: accompaniment.name,
        ...(accompaniment.brandId ? { brandId: accompaniment.brandId } : {}),
        unit: ProductUnit.Unit,
        requiredQuantity: accompaniment.quantityPerPortion * quantity,
        availableQuantity: accompaniment.availableQuantity ?? 0,
      })
    }
    return shortages
  }

  private calculateBaseUnitPrice(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): number {
    if (inputLine.kind === 'portion')
      return this.calculatePortionUnitPrice(
        configuration.size,
        configuration.selectedAccompaniments,
      )

    return this.money.execute(configuration.brand?.basePrice ?? product.resalePrice ?? 0)
  }

  private calculatePortionUnitPrice(
    size: ProductSize | undefined,
    accompaniments: readonly ProductAccompaniment[],
  ): number {
    const accompanimentsPrice = accompaniments.reduce(
      (sum, accompaniment) => sum + accompaniment.basePrice,
      0,
    )
    return this.money.execute((size?.basePrice ?? 0) + accompanimentsPrice)
  }

  private createLine(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
    baseUnitPrice: number,
    finalUnitPrice: number,
  ): CartLine {
    const configurationFields =
      inputLine.kind === 'portion'
        ? { sizeId: inputLine.sizeId, accompanimentIds: [...inputLine.accompanimentIds] }
        : {
            ...(inputLine.brandId ? { brandId: inputLine.brandId } : {}),
            accompanimentIds: [],
          }

    return {
      productId: product.productId,
      kind: inputLine.kind,
      quantity: inputLine.quantity,
      ...configurationFields,
      baseUnitPrice,
      finalUnitPrice,
      subtotal: this.money.execute(finalUnitPrice * inputLine.quantity),
      consumptions: this.buildConsumptions(inputLine, product, configuration),
    }
  }

  private buildConsumptions(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): readonly StockConsumption[] {
    if (inputLine.kind === 'portion')
      return this.buildPortionConsumptions(inputLine, product, configuration)

    return [
      {
        productId: product.productId,
        ...(configuration.brand ? { brandId: configuration.brand.brandId } : {}),
        quantity: inputLine.quantity,
      },
    ]
  }

  private buildPortionConsumptions(
    inputLine: RegistrationLine,
    product: SalesCatalogProduct,
    configuration: LineConfiguration,
  ): readonly StockConsumption[] {
    return [
      {
        productId: product.productId,
        quantity: (configuration.size?.quantity ?? 0) * inputLine.quantity,
      },
      ...configuration.selectedAccompaniments.map((accompaniment) => ({
        productId: accompaniment.productId ?? accompaniment.accompanimentId,
        accompanimentId: accompaniment.accompanimentId,
        ...(accompaniment.brandId ? { brandId: accompaniment.brandId } : {}),
        quantity: accompaniment.quantityPerPortion * inputLine.quantity,
      })),
    ]
  }
}
