import { Module } from '@nestjs/common'

import { MrpDatabaseModule } from '@/mrp/database/mrp-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import {
  AdjustProductStockController,
  AddRecipeIngredientController,
  CreateAccompanimentTypeController,
  GetProductAccompanimentsController,
  GetProductRecipeController,
  GetProductStockController,
  LinkProductAccompanimentController,
  ListAccompanimentTypesController,
  ListProductsController,
  ListStockTransactionsController,
  RegisterProductBrandController,
  RegisterProductController,
  RegisterProductionController,
  RemoveAccompanimentTypeController,
  RemoveProductAccompanimentController,
  RemoveRecipeIngredientController,
  RemoveProductBrandController,
  PreviewProductionController,
  SaveRecipeYieldController,
  SetPrimaryProductBrandController,
  RenameAccompanimentTypeController,
  UpdateProductAccompanimentController,
  UpdateProductBrandController,
  UpdateRecipeIngredientController,
} from '@/mrp/rest/controllers'

@Module({
  imports: [MrpDatabaseModule, ProvisionModule, SharedMessagingModule],
  controllers: [
    CreateAccompanimentTypeController,
    GetProductAccompanimentsController,
    LinkProductAccompanimentController,
    ListAccompanimentTypesController,
    RemoveAccompanimentTypeController,
    RemoveProductAccompanimentController,
    RenameAccompanimentTypeController,
    UpdateProductAccompanimentController,
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
