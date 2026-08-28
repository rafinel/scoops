import type { OrderRegisteredEvent } from '@scoops/core/pdv/domain/events'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
  StockTransactionsRepository,
} from '@scoops/core/mrp/interfaces'
import type { SalesCatalogProvider, StockConsumer } from '@scoops/core/pdv/interfaces'
import {
  ProductStockControl,
  StockTransactionType,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { TransactionBoundSalesCatalogProvider } from '@/mrp/provision/pdv/transaction-bound-sales-catalog-provider'
import { DrizzleAccompanimentTypesRepository } from '@/mrp/database/drizzle/repositories/drizzle-accompaniment-types-repository'
import { DrizzleBrandsRepository } from '@/mrp/database/drizzle/repositories/drizzle-brands-repository'
import { DrizzleProductAccompanimentsRepository } from '@/mrp/database/drizzle/repositories/drizzle-product-accompaniments-repository'
import { DrizzleProductsRepository } from '@/mrp/database/drizzle/repositories/drizzle-products-repository'
import { DrizzleProductSizesRepository } from '@/mrp/database/drizzle/repositories/drizzle-product-sizes-repository'
import { DrizzleResaleConfigurationsRepository } from '@/mrp/database/drizzle/repositories/drizzle-resale-configurations-repository'
import { DrizzleStockBalancesRepository } from '@/mrp/database/drizzle/repositories/drizzle-stock-balances-repository'
import { DrizzleStockTransactionsRepository } from '@/mrp/database/drizzle/repositories/drizzle-stock-transactions-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { DrizzleExecutor } from '@/shared/database/drizzle/drizzle-repository'

type TransactionBoundRepositories = {
  readonly products: ProductsRepository
  readonly productSizes: ProductSizesRepository
  readonly productAccompaniments: ProductAccompanimentsRepository
  readonly accompanimentTypes: AccompanimentTypesRepository
  readonly resaleConfigurations: ResaleConfigurationsRepository
  readonly brands: BrandsRepository
  readonly stockBalances: StockBalancesRepository
  readonly stockTransactions: StockTransactionsRepository
}

export type TransactionBoundOrderRegistrationDependencies = {
  readonly salesCatalogProvider: SalesCatalogProvider
  readonly stockConsumer: StockConsumer
}

@Injectable()
export class TransactionBoundOrderRegistrationDependenciesFactory {
  constructor(@Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient) {}

  forExecutor(executor: DrizzleExecutor): TransactionBoundOrderRegistrationDependencies {
    const repositories = this.createRepositories(executor)

    return {
      salesCatalogProvider: new TransactionBoundSalesCatalogProvider(
        repositories.products,
        repositories.productSizes,
        repositories.productAccompaniments,
        repositories.accompanimentTypes,
        repositories.resaleConfigurations,
        repositories.brands,
        repositories.stockBalances,
      ),
      stockConsumer: new TransactionBoundStockConsumer(
        repositories.products,
        repositories.brands,
        repositories.stockBalances,
        repositories.stockTransactions,
      ),
    }
  }

  private createRepositories(executor: DrizzleExecutor): TransactionBoundRepositories {
    return {
      products: new DrizzleProductsRepository(this.drizzleClient, executor),
      productSizes: new DrizzleProductSizesRepository(this.drizzleClient, executor),
      productAccompaniments: new DrizzleProductAccompanimentsRepository(
        this.drizzleClient,
        executor,
      ),
      accompanimentTypes: new DrizzleAccompanimentTypesRepository(
        this.drizzleClient,
        executor,
      ),
      resaleConfigurations: new DrizzleResaleConfigurationsRepository(
        this.drizzleClient,
        executor,
      ),
      brands: new DrizzleBrandsRepository(this.drizzleClient, executor),
      stockBalances: new DrizzleStockBalancesRepository(this.drizzleClient, executor),
      stockTransactions: new DrizzleStockTransactionsRepository(
        this.drizzleClient,
        executor,
      ),
    }
  }
}

class TransactionBoundStockConsumer implements StockConsumer {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly brandsRepository: BrandsRepository,
    private readonly stockBalancesRepository: StockBalancesRepository,
    private readonly stockTransactionsRepository: StockTransactionsRepository,
  ) {}

  async consume(event: OrderRegisteredEvent): Promise<void> {
    for (const consumption of event.payload.consumptions)
      await this.consumeProduct(event, consumption)
  }

  private async consumeProduct(
    event: OrderRegisteredEvent,
    consumption: OrderRegisteredEvent['payload']['consumptions'][number],
  ): Promise<void> {
    const { establishmentId } = event.payload
    const product = await this.productsRepository.findById(
      establishmentId,
      consumption.productId,
    )
    if (!product || product.establishmentId !== establishmentId)
      throw new ConflictError('O estoque do pedido não está mais disponível.')

    if (
      (product.stockControl === ProductStockControl.Single && consumption.brandId) ||
      (product.stockControl === ProductStockControl.ByBrand && !consumption.brandId)
    )
      throw new ConflictError('A configuração de estoque do pedido foi alterada.')

    const brand = consumption.brandId
      ? await this.brandsRepository.findById(product.id, consumption.brandId)
      : undefined
    if (consumption.brandId && !brand)
      throw new ConflictError('A marca do pedido não está mais disponível.')

    const balance = await this.stockBalancesRepository.add(
      {
        productId: product.id,
        ...(consumption.brandId ? { brandId: consumption.brandId } : {}),
      },
      -consumption.quantity,
      0,
    )
    await this.stockTransactionsRepository.add({
      establishmentId,
      productId: product.id,
      ...(consumption.brandId
        ? { brandId: consumption.brandId, brandName: brand?.name }
        : {}),
      orderId: event.payload.orderId,
      productName: product.name,
      unit: product.unit,
      type: StockTransactionType.Sale,
      quantity: consumption.quantity,
      balanceAfter: balance.quantity,
      performedBy: event.payload.actorId,
      performedByName: event.payload.actorName,
      occurredAt: event.payload.occurredAt,
    })
  }
}
