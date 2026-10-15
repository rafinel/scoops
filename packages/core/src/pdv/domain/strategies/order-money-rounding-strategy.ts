import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type OrderMoneyInput =
  | number
  | {
      readonly amount: number
      readonly percentage?: number
    }

/** Applies an optional order-channel percentage and rounds the result to cents. */
export class OrderMoneyRoundingStrategy
  implements BusinessRuleStrategy<OrderMoneyInput, number>
{
  execute(input: OrderMoneyInput): number {
    const amount = typeof input === 'number' ? input : this.applyPercentage(input)

    return this.roundToCents(amount)
  }

  private applyPercentage(input: Exclude<OrderMoneyInput, number>): number {
    return input.amount * (1 + (input.percentage ?? 0) / 100)
  }

  private roundToCents(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100
  }
}
