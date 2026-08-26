import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Put } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { SaveProductResaleConfigurationUseCase } from '@scoops/core/mrp/use-cases'
import type { Broker } from '@scoops/core/shared/interfaces'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductPricingResponseDto } from '@/mrp/rest/dtos'
import { saveProductResaleConfigurationSchema } from '@/mrp/rest/schemas/product-schemas'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<
  SaveProductResaleConfigurationUseCase['execute']
>[0]['input']

@MrpController()
export class SaveBrandResaleConfigurationController {
  private readonly useCase: SaveProductResaleConfigurationUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new SaveProductResaleConfigurationUseCase(database, broker)
  }

  @Put(':productId/brands/:brandId/resale-configuration')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The By-brand resale product.',
  })
  @ApiParam({ name: 'brandId', format: 'uuid', description: 'The owned brand target.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand resale configuration saved.',
    type: ProductPricingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product or resale mode is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot save resale pricing.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product or brand was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The resale configuration conflicted with current state.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Body(new ZodValidationPipe(saveProductResaleConfigurationSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, brandId, input: body })
  }
}
