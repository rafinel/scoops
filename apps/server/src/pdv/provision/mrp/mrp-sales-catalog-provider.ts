import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import { Injectable, Inject } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { TransactionBoundSalesCatalogProvider } from '@/mrp/provision/pdv/transaction-bound-sales-catalog-provider'

@Injectable()
export class MrpSalesCatalogProvider extends TransactionBoundSalesCatalogProvider {
  constructor(
    @Inject(MRP_REPOSITORIES.products)
    productsRepository: ProductsRepository,
    @Inject(MRP_REPOSITORIES.productSizes)
    productSizesRepository: ProductSizesRepository,
    @Inject(MRP_REPOSITORIES.productAccompaniments)
    productAccompanimentsRepository: ProductAccompanimentsRepository,
    @Inject(MRP_REPOSITORIES.accompanimentTypes)
    accompanimentTypesRepository: AccompanimentTypesRepository,
    @Inject(MRP_REPOSITORIES.resaleConfigurations)
    resaleConfigurationsRepository: ResaleConfigurationsRepository,
    @Inject(MRP_REPOSITORIES.brands)
    brandsRepository: BrandsRepository,
    @Inject(MRP_REPOSITORIES.stockBalances)
    stockBalancesRepository: StockBalancesRepository,
  ) {
    super(
      productsRepository,
      productSizesRepository,
      productAccompanimentsRepository,
      accompanimentTypesRepository,
      resaleConfigurationsRepository,
      brandsRepository,
      stockBalancesRepository,
    )
  }
}
