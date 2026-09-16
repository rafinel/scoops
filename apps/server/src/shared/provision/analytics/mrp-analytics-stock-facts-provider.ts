import type { AnalyticsStockFactsProvider } from '@scoops/core/analytics/interfaces'
import type { ListStockAttentionUseCase } from '@scoops/core/mrp/use-cases'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MrpAnalyticsStockFactsProvider implements AnalyticsStockFactsProvider {
  constructor(
    private readonly listStockAttention: Pick<ListStockAttentionUseCase, 'execute'>,
  ) {}

  list(establishmentId: string) {
    return this.listStockAttention.execute({ establishmentId }).then((facts) =>
      facts.map(
        ({
          establishmentId: _establishmentId,
          idealQuantity,
          maximumProducibleQuantity,
          ...fact
        }) => ({
          ...fact,
          idealQuantity: idealQuantity ?? null,
          maximumProducibleQuantity: maximumProducibleQuantity ?? null,
        }),
      ),
    )
  }
}
