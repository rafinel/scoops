import { Get, Inject } from '@nestjs/common'
import type { Account } from '@scoops/core/identity/domain/entities'
import { GetStockAttentionUseCase } from '@scoops/core/analytics/use-cases'
import type {
  AnalyticsContextProvider,
  AnalyticsStockFactsProvider,
} from '@scoops/core/analytics/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import { AnalyticsController } from '@/analytics/decorators/analytics-controller'
import { ANALYTICS_PROVIDERS } from '@/analytics/constants'
import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { StockAttentionResponseDto } from '../dtos'

@AnalyticsController()
export class GetStockAttentionController {
  private readonly useCase: GetStockAttentionUseCase

  constructor(
    @Inject(ANALYTICS_PROVIDERS.context) context: AnalyticsContextProvider,
    @Inject(ANALYTICS_PROVIDERS.stockFacts) facts: AnalyticsStockFactsProvider,
    @Inject(ANALYTICS_PROVIDERS.datetime) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new GetStockAttentionUseCase(context, facts, datetimeProvider)
  }

  @Get('stock-attention')
  @RequiredProfiles([UserProfile.Manager])
  async handle(@CurrentAccount() actor: Account): Promise<StockAttentionResponseDto> {
    const result = await this.useCase.execute({
      actor: {
        userId: actor.id,
        establishmentId: actor.establishmentId,
        profile: actor.profile === UserProfile.Manager ? 'manager' : 'operator',
      },
    })
    return StockAttentionResponseDto.from(result)
  }
}
