import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { RegisterProductionUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductionResponseDto } from '@/mrp/rest/dtos'
import { productionSchema } from '@/mrp/rest/schemas/product-schemas'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<RegisterProductionUseCase['execute']>[0]['input']

@MrpController()
export class RegisterProductionController {
  private readonly useCase: RegisterProductionUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterProductionUseCase(database, datetimeProvider)
  }

  @Post(':productId/productions')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The manufacturable product.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Production registered.',
    type: ProductionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The recipe, source, balance, or production request is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot register production.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The production commit conflicted with another write.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(productionSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, input: body })
  }
}
