import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type {
  ProductsRepository,
  StockTransactionsRepository,
} from '@scoops/core/mrp/interfaces'
import { ListStockTransactionsUseCase } from '@scoops/core/mrp/use-cases'
import { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { StockTransactionPageResponseDto } from '@/mrp/rest/dtos'
import { stockTransactionListSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type QueryInput = z.infer<typeof stockTransactionListSchema>

@MrpController()
export class ListStockTransactionsController {
  private readonly useCase: ListStockTransactionsUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.products) productsRepository: ProductsRepository,
    @Inject(MRP_STOCK_TRANSACTIONS_REPOSITORY)
    stockTransactionsRepository: StockTransactionsRepository,
  ) {
    this.useCase = new ListStockTransactionsUseCase(
      productsRepository,
      stockTransactionsRepository,
    )
  }

  @Get(':productId/stock-transactions')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The product whose history is listed.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock transaction page returned.',
    type: StockTransactionPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The history filters are malformed or invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read stock history.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query(new ZodValidationPipe(stockTransactionListSchema)) params: QueryInput,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, params })
  }
}
