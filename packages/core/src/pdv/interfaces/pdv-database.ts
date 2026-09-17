import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrderSequencesRepository } from '#pdv/interfaces/order-sequences-repository.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { StockProvider } from '#pdv/interfaces/stock-provider.ts'
import type { OrderCostProvider } from '#pdv/interfaces/order-cost-provider.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

export type PdvDatabaseRepositories = {
  salesCatalogProvider?: SalesCatalogProvider
  salesChannelsRepository: SalesChannelsRepository
  discountsRepository: DiscountsRepository
  ordersRepository: OrdersRepository
  orderSequencesRepository: OrderSequencesRepository
  stockProvider?: StockProvider
  orderCostProvider?: OrderCostProvider
  eventsRepository: Pick<EventsRepository, 'add'>
}

export interface PdvDatabase {
  run<Result>(
    operation: (repositories: PdvDatabaseRepositories) => Promise<Result>,
  ): Promise<Result>
  readSnapshot?<Result>(
    operation: (
      repositories: Pick<
        PdvDatabaseRepositories,
        'ordersRepository' | 'salesChannelsRepository'
      >,
    ) => Promise<Result>,
  ): Promise<Result>
}
