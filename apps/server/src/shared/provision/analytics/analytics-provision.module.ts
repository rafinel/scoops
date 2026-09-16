import { DynamicModule, InjectionToken, Module, Provider, Type } from '@nestjs/common'
import { ListStockAttentionUseCase } from '@scoops/core/mrp/use-cases'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import type { SubscriptionsRepository } from '@scoops/core/billing/interfaces'

import { ANALYTICS_PROVIDERS } from '@/analytics/constants'
import { IdentityBillingAnalyticsContextProvider } from './identity-billing-analytics-context-provider'
import { PdvAnalyticsSalesFactsProvider } from './pdv-analytics-sales-facts-provider'
import { MrpAnalyticsStockFactsProvider } from './mrp-analytics-stock-facts-provider'

@Module({})
export class AnalyticsProvisionModule {
  static register(options: {
    imports: Type<unknown>[]
    pdvDatabaseToken: InjectionToken
    mrpDatabaseToken: InjectionToken
    identityEstablishmentsToken: InjectionToken
    billingSubscriptionsToken: InjectionToken
    datetimeProviderToken: InjectionToken
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ANALYTICS_PROVIDERS.context,
        inject: [
          options.identityEstablishmentsToken,
          options.billingSubscriptionsToken,
          options.datetimeProviderToken,
        ],
        useFactory: (
          establishmentsRepository: EstablishmentsRepository,
          subscriptionsRepository: SubscriptionsRepository,
          datetimeProvider: DatetimeProvider,
        ) =>
          new IdentityBillingAnalyticsContextProvider(
            establishmentsRepository,
            subscriptionsRepository,
            datetimeProvider,
          ),
      },
      {
        provide: ANALYTICS_PROVIDERS.salesFacts,
        inject: [options.pdvDatabaseToken, options.mrpDatabaseToken],
        useFactory: (pdvDatabase, mrpDatabase) =>
          new PdvAnalyticsSalesFactsProvider(pdvDatabase, mrpDatabase),
      },
      {
        provide: ANALYTICS_PROVIDERS.stockFacts,
        inject: [options.mrpDatabaseToken],
        useFactory: (database) =>
          new MrpAnalyticsStockFactsProvider(new ListStockAttentionUseCase(database)),
      },
      {
        provide: ANALYTICS_PROVIDERS.datetime,
        useExisting: options.datetimeProviderToken,
      },
    ]
    return {
      module: AnalyticsProvisionModule,
      imports: options.imports,
      providers,
      exports: Object.values(ANALYTICS_PROVIDERS),
    }
  }
}
