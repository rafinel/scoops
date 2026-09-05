import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrderSequencesRepository } from '#pdv/interfaces/order-sequences-repository.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { StockConsumer } from '#pdv/interfaces/stock-consumer.ts'
import type { StockRestorer } from '#pdv/interfaces/stock-restorer.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

export type PdvDatabaseRepositories = {
  salesCatalogProvider: SalesCatalogProvider
  salesChannelsRepository: SalesChannelsRepository
  discountsRepository: DiscountsRepository
  ordersRepository: OrdersRepository
  orderSequencesRepository: OrderSequencesRepository
  stockConsumer: StockConsumer
  stockRestorer: StockRestorer
  eventsRepository: Pick<EventsRepository, 'add'>
}

export interface PdvDatabase {
  run<Result>(
    operation: (scope: PdvDatabaseRepositories) => Promise<Result>,
  ): Promise<Result>
}
