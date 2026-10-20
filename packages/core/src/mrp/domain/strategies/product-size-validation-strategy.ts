import type { RegisterProductSizeInput } from '#mrp/domain/structures/register-product-size-input.ts'
import type { ProductSizeValidationResult } from '#mrp/domain/structures/product-size-validation-result.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

const SIZE_NAME_MAX_LENGTH = 120
// numeric(18,3) and numeric(18,2) are bounded below 10^15 and 10^16 respectively.
const SIZE_QUANTITY_MAX_EXCLUSIVE = 1_000_000_000_000_000
const SIZE_PRICE_MAX_EXCLUSIVE = 10_000_000_000_000_000

export const PRODUCT_SIZE_VALIDATION_MESSAGES = {
  invalid_name: 'O nome do tamanho deve possuir entre 1 e 120 caracteres.',
  invalid_quantity: 'A quantidade deve ser positiva e possuir até três casas decimais.',
  invalid_price: 'O preço deve ser não negativo e possuir até duas casas decimais.',
} as const satisfies Record<Exclude<ProductSizeValidationResult, 'valid'>, string>

export class ProductSizeValidationStrategy
  implements BusinessRuleStrategy<RegisterProductSizeInput, ProductSizeValidationResult>
{
  execute(input: RegisterProductSizeInput): ProductSizeValidationResult {
    if (!this.hasValidName(input.name)) return 'invalid_name'
    if (!this.hasValidQuantity(input.quantity)) return 'invalid_quantity'
    if (!this.hasValidPrice(input.price)) return 'invalid_price'
    return 'valid'
  }

  private hasValidName(name: string): boolean {
    const trimmed = name.trim()
    return trimmed.length > 0 && trimmed.length <= SIZE_NAME_MAX_LENGTH
  }

  private hasValidQuantity(quantity: number): boolean {
    return (
      Number.isFinite(quantity) &&
      quantity > 0 &&
      quantity < SIZE_QUANTITY_MAX_EXCLUSIVE &&
      this.hasAtMostDecimalPlaces(quantity, 3)
    )
  }

  private hasValidPrice(price: number): boolean {
    return (
      Number.isFinite(price) &&
      price >= 0 &&
      price < SIZE_PRICE_MAX_EXCLUSIVE &&
      this.hasAtMostDecimalPlaces(price, 2)
    )
  }

  private hasAtMostDecimalPlaces(value: number, places: number): boolean {
    return Number(value.toFixed(places)) === value
  }
}
