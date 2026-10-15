import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export class AccompanimentPriceValidationStrategy
  implements BusinessRuleStrategy<number | undefined, number | 'missing' | 'invalid'>
{
  execute(price: number | undefined): number | 'missing' | 'invalid' {
    if (price === undefined) return 'missing'
    return this.isValid(price) ? price : 'invalid'
  }

  private isValid(price: number): boolean {
    return this.isFiniteNonNegative(price) && this.hasAtMostTwoDecimalPlaces(price)
  }

  private isFiniteNonNegative(price: number): boolean {
    return Number.isFinite(price) && price >= 0
  }

  private hasAtMostTwoDecimalPlaces(price: number): boolean {
    return Number(price.toFixed(2)) === price
  }
}
