import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { AdjustProductStockUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { StockBalanceResponseDto } from '@/mrp/rest/dtos'
import { adjustProductStockSchema } from '@/mrp/rest/schemas/product-schemas'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<AdjustProductStockUseCase['execute']>[0]['input']

@MrpController()
export class AdjustProductStockController {
  private readonly useCase: AdjustProductStockUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new AdjustProductStockUseCase(database, datetimeProvider)
  }

  @Post(':productId/stock-adjustments')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The product whose stock is adjusted.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product stock adjusted.',
    type: StockBalanceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The adjustment is malformed, invalid, or would violate the balance policy.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot adjust stock.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product or brand was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The adjustment conflicted with another stock write.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(adjustProductStockSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, input: body })
  }
}
