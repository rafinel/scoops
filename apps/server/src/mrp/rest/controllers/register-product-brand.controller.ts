import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { RegisterProductBrandUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductBrandStockResponseDto } from '@/mrp/rest/dtos'
import { productBrandSchema } from '@/mrp/rest/schemas/product-schemas'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<RegisterProductBrandUseCase['execute']>[0]['input']

@MrpController()
export class RegisterProductBrandController {
  private readonly useCase: RegisterProductBrandUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterProductBrandUseCase(database, datetimeProvider)
  }

  @Post(':productId/brands')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The owning product.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product brand registered.',
    type: ProductBrandStockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The brand request is malformed or invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot register brands.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The brand name conflicts with an existing brand.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(productBrandSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, input: body })
  }
}
