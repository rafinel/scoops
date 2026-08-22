import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import {
  AdjustProductStockController,
  AddRecipeIngredientController,
  GetProductRecipeController,
  GetProductStockController,
  ListProductsController,
  ListStockTransactionsController,
  RegisterProductBrandController,
  RegisterProductController,
  RegisterProductionController,
  RemoveRecipeIngredientController,
  RemoveProductBrandController,
  PreviewProductionController,
  SaveRecipeYieldController,
  SetPrimaryProductBrandController,
  UpdateProductBrandController,
  UpdateRecipeIngredientController,
} from '@/mrp/rest/controllers'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule, SharedMessagingModule],
  controllers: [
    AdjustProductStockController,
    AddRecipeIngredientController,
    GetProductRecipeController,
    GetProductStockController,
    ListProductsController,
    ListStockTransactionsController,
    RegisterProductBrandController,
    RegisterProductController,
    RegisterProductionController,
    RemoveRecipeIngredientController,
    RemoveProductBrandController,
    PreviewProductionController,
    SaveRecipeYieldController,
    SetPrimaryProductBrandController,
    UpdateProductBrandController,
    UpdateRecipeIngredientController,
  ],
  exports: [MrpDatabaseModule],
})
export class MrpModule {}
