import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type {
  BrandsRepository,
  ProductsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import { GetProductStockUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductStockResponseDto } from '@/mrp/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class GetProductStockController {
  private readonly useCase: GetProductStockUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.products) productsRepository: ProductsRepository,
    @Inject(MRP_REPOSITORIES.brands) brandsRepository: BrandsRepository,
    @Inject(MRP_REPOSITORIES.stockBalances)
    stockBalancesRepository: StockBalancesRepository,
  ) {
    this.useCase = new GetProductStockUseCase(
      productsRepository,
      brandsRepository,
      stockBalancesRepository,
    )
  }

  @Get(':productId/stock')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The product to read.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product stock returned.',
    type: ProductStockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product identifier is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read product stock.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId })
  }
}
