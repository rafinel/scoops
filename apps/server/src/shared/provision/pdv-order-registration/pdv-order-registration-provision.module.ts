import { DynamicModule, InjectionToken, Module, Provider, Type } from '@nestjs/common'

import { MrpOrderCostProvider } from './mrp-order-cost-provider'
import { MrpSalesCatalogProvider } from './mrp-sales-catalog-provider'
import { MrpStockProvider } from './mrp-stock-provider'

@Module({})
export class PdvOrderRegistrationProvisionModule {
  static register(options: {
    imports: Type<unknown>[]
    databaseToken: InjectionToken
    consumeOrderStockToken: InjectionToken
    restoreOrderStockToken: InjectionToken
    providerTokens: {
      salesCatalog: InjectionToken
      orderCost: InjectionToken
      stockProvider: InjectionToken
    }
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MrpSalesCatalogProvider,
        inject: [options.databaseToken],
        useFactory: (
          database: ConstructorParameters<typeof MrpSalesCatalogProvider>[0],
        ) => new MrpSalesCatalogProvider(database),
      },
      {
        provide: MrpOrderCostProvider,
        inject: [options.databaseToken],
        useFactory: (database: ConstructorParameters<typeof MrpOrderCostProvider>[0]) =>
          new MrpOrderCostProvider(database),
      },
      {
        provide: MrpStockProvider,
        inject: [options.consumeOrderStockToken, options.restoreOrderStockToken],
        useFactory: (
          consumeOrderStock: ConstructorParameters<typeof MrpStockProvider>[0],
          restoreOrderStock: ConstructorParameters<typeof MrpStockProvider>[1],
        ) => new MrpStockProvider(consumeOrderStock, restoreOrderStock),
      },
      {
        provide: options.providerTokens.salesCatalog,
        useExisting: MrpSalesCatalogProvider,
      },
      { provide: options.providerTokens.orderCost, useExisting: MrpOrderCostProvider },
      { provide: options.providerTokens.stockProvider, useExisting: MrpStockProvider },
    ]
    return {
      module: PdvOrderRegistrationProvisionModule,
      imports: options.imports,
      providers,
      exports: [
        options.providerTokens.salesCatalog,
        options.providerTokens.orderCost,
        options.providerTokens.stockProvider,
        MrpSalesCatalogProvider,
        MrpOrderCostProvider,
        MrpStockProvider,
      ],
    }
  }
}
