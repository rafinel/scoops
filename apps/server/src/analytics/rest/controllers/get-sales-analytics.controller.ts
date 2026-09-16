import { Get, Inject, Query } from '@nestjs/common'
import type { Account } from '@scoops/core/identity/domain/entities'
import { GetSalesAnalyticsUseCase } from '@scoops/core/analytics/use-cases'
import type {
  AnalyticsContextProvider,
  AnalyticsSalesFactsProvider,
} from '@scoops/core/analytics/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import { analyticsPeriodQuerySchema, type AnalyticsPeriodQuery } from '@scoops/validation'
import { AnalyticsController } from '@/analytics/decorators/analytics-controller'
import { ANALYTICS_PROVIDERS } from '@/analytics/constants'
import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { SalesAnalyticsResponseDto } from '../dtos'

@AnalyticsController()
export class GetSalesAnalyticsController {
  private readonly useCase: GetSalesAnalyticsUseCase

  constructor(
    @Inject(ANALYTICS_PROVIDERS.context) context: AnalyticsContextProvider,
    @Inject(ANALYTICS_PROVIDERS.salesFacts) facts: AnalyticsSalesFactsProvider,
    @Inject(ANALYTICS_PROVIDERS.datetime) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new GetSalesAnalyticsUseCase(context, facts, datetimeProvider)
  }

  @Get('sales')
  @RequiredProfiles([UserProfile.Manager])
  async handle(
    @Query(new ZodValidationPipe(analyticsPeriodQuerySchema)) query: AnalyticsPeriodQuery,
    @CurrentAccount() actor: Account,
  ): Promise<SalesAnalyticsResponseDto> {
    const result = await this.useCase.execute({
      actor: {
        userId: actor.id,
        establishmentId: actor.establishmentId,
        profile: actor.profile === UserProfile.Manager ? 'manager' : 'operator',
      },
      period: query.period,
    })
    return SalesAnalyticsResponseDto.from(result)
  }
}
