import { DynamicModule, InjectionToken, Module, Provider, Type } from '@nestjs/common'
import { ListStockAttentionUseCase } from '@scoops/core/mrp/use-cases'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'

import { ANALYTICS_PROVIDERS } from '@/analytics/constants'
import { IdentityAnalyticsContextProvider } from './identity-analytics-context-provider'
import { PdvAnalyticsSalesFactsProvider } from './pdv-analytics-sales-facts-provider'
import { MrpAnalyticsStockFactsProvider } from './mrp-analytics-stock-facts-provider'

@Module({})
export class AnalyticsProvisionModule {
  static register(options: {
    imports: Type<unknown>[]
    pdvDatabaseToken: InjectionToken
    mrpDatabaseToken: InjectionToken
    identityEstablishmentsToken: InjectionToken
    datetimeProviderToken: InjectionToken
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ANALYTICS_PROVIDERS.context,
        inject: [options.identityEstablishmentsToken],
        useFactory: (establishmentsRepository: EstablishmentsRepository) =>
          new IdentityAnalyticsContextProvider(establishmentsRepository),
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
