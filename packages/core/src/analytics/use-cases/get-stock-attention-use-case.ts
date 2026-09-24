import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { StockAttention } from '#analytics/domain/structures/stock-attention.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsStockFactsProvider } from '#analytics/interfaces/analytics-stock-facts-provider.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: AnalyticsActor }

const priority: Record<'zero-stock' | 'below-ideal' | 'limited-production', number> = {
  'zero-stock': 0,
  'below-ideal': 1,
  'limited-production': 2,
}

export class GetStockAttentionUseCase implements UseCase<Request, StockAttention> {
  constructor(
    private readonly contextProvider: AnalyticsContextProvider,
    private readonly stockFactsProvider: AnalyticsStockFactsProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute({ actor }: Request): Promise<StockAttention> {
    if (actor.profile !== 'manager')
      throw new AuthorizationError('Acesso não autorizado.')

    const context = await this.contextProvider.resolve(actor)
    if (
      context.establishmentId !== actor.establishmentId ||
      !context.establishmentIsActive
    ) {
      throw new AuthorizationError('Acesso não autorizado.')
    }

    const facts = await this.stockFactsProvider.list(context.establishmentId)
    const items = [...facts]
      .sort((left, right) => {
        const kindOrder = priority[left.kind] - priority[right.kind]
        if (kindOrder !== 0) return kindOrder
        const severityOrder = right.severity - left.severity
        if (severityOrder !== 0) return severityOrder
        return left.productId.localeCompare(right.productId)
      })
      .slice(0, 5)

    return { updatedAt: this.datetimeProvider.now(), items }
  }
}
