import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

// numeric(18,2) is bounded below 10^16; the JS number form of its .99 maximum rounds up.
const ACCOMPANIMENT_PRICE_MAX_EXCLUSIVE = 10_000_000_000_000_000

export class AccompanimentPriceValidationStrategy
  implements BusinessRuleStrategy<number | undefined, number | 'missing' | 'invalid'>
{
  execute(price: number | undefined): number | 'missing' | 'invalid' {
    if (price === undefined) return 'missing'
    return this.isValid(price) ? price : 'invalid'
  }

  private isValid(price: number): boolean {
    return (
      this.isFiniteNonNegative(price) &&
      this.isBelowNumericPrecisionLimit(price) &&
      this.hasAtMostTwoDecimalPlaces(price)
    )
  }

  private isFiniteNonNegative(price: number): boolean {
    return Number.isFinite(price) && price >= 0
  }

  private isBelowNumericPrecisionLimit(price: number): boolean {
    return price < ACCOMPANIMENT_PRICE_MAX_EXCLUSIVE
  }

  private hasAtMostTwoDecimalPlaces(price: number): boolean {
    return Number(price.toFixed(2)) === price
  }
}
