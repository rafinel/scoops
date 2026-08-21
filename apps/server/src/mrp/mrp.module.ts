import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import {
  AdjustProductStockController,
  GetProductStockController,
  ListProductsController,
  ListStockTransactionsController,
  RegisterProductBrandController,
  RegisterProductController,
  RemoveProductBrandController,
  SetPrimaryProductBrandController,
  UpdateProductBrandController,
} from '@/mrp/rest/controllers'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule, SharedMessagingModule],
  controllers: [
    AdjustProductStockController,
    GetProductStockController,
    ListProductsController,
    ListStockTransactionsController,
    RegisterProductBrandController,
    RegisterProductController,
    RemoveProductBrandController,
    SetPrimaryProductBrandController,
    UpdateProductBrandController,
  ],
  exports: [MrpDatabaseModule],
})
export class MrpModule {}
