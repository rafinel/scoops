import type { Combo } from '#pdv/domain/entities/combo.ts'
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { CartDiscount } from '#pdv/domain/structures/cart-discount.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import type { OrderRegistrationInvalidConfiguration } from '#pdv/domain/structures/order-registration-invalid-configuration.ts'
import type { OrderRegistrationShortage } from '#pdv/domain/structures/order-registration-shortage.ts'
import type { SaleItemKind as SaleItemKindValue } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { OrderLinePriceStrategy } from '#pdv/domain/strategies/order-line-price-strategy.ts'
import { OrderMoneyRoundingStrategy } from '#pdv/domain/strategies/order-money-rounding-strategy.ts'
import { OrderPreviewInputValidationStrategy } from '#pdv/domain/strategies/order-preview-input-validation-strategy.ts'
import { ComboAllocationStrategy } from '#pdv/domain/strategies/combo-allocation-strategy.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type CartPricingInput = {
  readonly input: OrderPreviewInput
  readonly products: readonly SalesCatalogProduct[]
  readonly channel?: SalesChannel
  readonly combos: readonly Combo[]
  readonly establishmentId: string
}

type CartIssues = {
  readonly cart: Cart
  readonly invalidConfigurations: readonly OrderRegistrationInvalidConfiguration[]
  readonly shortages: readonly OrderRegistrationShortage[]
}

type RegistrationLine = OrderPreviewInput['lines'][number]

export class OrderCartPricingStrategy
  implements BusinessRuleStrategy<CartPricingInput, CartIssues>
{
  private readonly inputValidation = new OrderPreviewInputValidationStrategy()
  private readonly linePricing = new OrderLinePriceStrategy()
  private readonly comboAllocation = new ComboAllocationStrategy()
  private readonly money = new OrderMoneyRoundingStrategy()

  execute(input: CartPricingInput): CartIssues {
    this.inputValidation.execute(input.input)
    const productsById = new Map(
      input.products.map((product) => [product.productId, product]),
    )
    const invalidConfigurations: OrderRegistrationInvalidConfiguration[] = []
    const shortages: OrderRegistrationShortage[] = []
    const lines: Cart['lines'][number][] = []

    for (const inputLine of input.input.lines) {
      const product = productsById.get(inputLine.productId)
      const invalid = this.validateProductConfiguration(inputLine, product)
      if (invalid) {
        invalidConfigurations.push(invalid)
        continue
      }
      if (!product) continue

      const built = this.linePricing.execute({
        inputLine,
        product,
        channelPercentage: input.channel?.percentage ?? 0,
      })
      lines.push(built.line)
      shortages.push(...built.shortages)
    }

    return {
      cart: this.createCart(input.establishmentId, input.channel, lines, input.combos),
      invalidConfigurations,
      shortages,
    }
  }

  private createCart(
    establishmentId: string,
    channel: SalesChannel | undefined,
    lines: Cart['lines'],
    combos: readonly Combo[],
  ): Cart {
    const subtotal = this.money.execute(
      lines.reduce((sum, line) => sum + line.subtotal, 0),
    )
    const baseCart: Cart = {
      establishmentId,
      ...(channel ? { channelId: channel.id } : {}),
      lines,
      discounts: [],
      subtotal,
      totalDiscount: 0,
      total: subtotal,
    }
    const discounts: readonly CartDiscount[] = this.comboAllocation.execute({
      cart: baseCart,
      combos,
    })
    const totalDiscount = this.money.execute(
      discounts.reduce((sum, discount) => sum + discount.savings, 0),
    )

    return {
      ...baseCart,
      discounts,
      totalDiscount,
      total: Math.max(0, this.money.execute(subtotal - totalDiscount)),
    }
  }

  private validateProductConfiguration(
    line: RegistrationLine,
    product: SalesCatalogProduct | undefined,
  ): OrderRegistrationInvalidConfiguration | undefined {
    const selectedId = this.getSelectedId(line)
    if (!product)
      return this.invalid(
        line,
        'product',
        selectedId,
        'O produto não está mais disponível.',
      )
    if (!product.isActive)
      return this.invalid(
        line,
        'product',
        selectedId,
        'O produto está inativo.',
        product.name,
      )
    if (product.kind !== line.kind)
      return this.invalid(
        line,
        'kind',
        selectedId,
        'O tipo do produto mudou.',
        product.name,
      )

    return line.kind === 'portion'
      ? this.validatePortionConfiguration(line, product)
      : this.validateResaleConfiguration(line, product)
  }

  private getSelectedId(line: RegistrationLine): string {
    return line.kind === 'portion' ? line.sizeId : (line.brandId ?? line.productId)
  }

  private validatePortionConfiguration(
    line: Extract<RegistrationLine, { kind: 'portion' }>,
    product: SalesCatalogProduct,
  ): OrderRegistrationInvalidConfiguration | undefined {
    const size = product.sizes.find((candidate) => candidate.sizeId === line.sizeId)
    if (!size?.isActive)
      return this.invalid(
        line,
        'size',
        line.sizeId,
        'O tamanho selecionado não está mais disponível.',
        product.name,
      )

    for (const accompanimentId of line.accompanimentIds) {
      const accompaniment = size.accompaniments.find(
        (candidate) => candidate.accompanimentId === accompanimentId,
      )
      if (!accompaniment?.isActive)
        return this.invalid(
          line,
          'accompaniment',
          accompanimentId,
          'O acompanhamento selecionado não está mais disponível.',
          product.name,
        )
    }
    return undefined
  }

  private validateResaleConfiguration(
    line: Extract<RegistrationLine, { kind: 'resale' }>,
    product: SalesCatalogProduct,
  ): OrderRegistrationInvalidConfiguration | undefined {
    const selectedId = this.getSelectedId(line)
    if (product.stockControl === ProductStockControl.Single) {
      if (line.brandId || product.resalePrice === undefined)
        return this.invalid(
          line,
          'resale',
          selectedId,
          'A configuração de revenda mudou.',
          product.name,
        )
      return undefined
    }

    const brand = line.brandId
      ? product.resaleBrands.find((candidate) => candidate.brandId === line.brandId)
      : undefined
    return brand?.isActive
      ? undefined
      : this.invalid(
          line,
          'brand',
          selectedId,
          'A marca selecionada não está mais disponível.',
          product.name,
        )
  }

  private invalid(
    line: RegistrationLine,
    reason: string,
    selectedId: string,
    message: string,
    productName = 'Produto não encontrado',
  ): OrderRegistrationInvalidConfiguration {
    return {
      productId: line.productId,
      productName,
      selectedKind: line.kind as SaleItemKindValue,
      selectedId,
      reason,
      correctiveMessage: message,
    }
  }
}
