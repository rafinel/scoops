import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { UpdateProductAccompanimentUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductAccompanimentDetailsResponseDto } from '@/mrp/rest/dtos'
import { updateProductAccompanimentSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<UpdateProductAccompanimentUseCase['execute']>[0]['input']

@MrpController()
export class UpdateProductAccompanimentController {
  private readonly useCase: UpdateProductAccompanimentUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new UpdateProductAccompanimentUseCase(database)
  }

  @Patch(':productId/accompaniments/:linkId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The Portion product.' })
  @ApiParam({ name: 'linkId', format: 'uuid', description: 'The accompaniment link.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product accompaniment updated.',
    type: ProductAccompanimentDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The update body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The quantity is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot update accompaniments.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product, link, or type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The accompaniment update conflicted.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body(new ZodValidationPipe(updateProductAccompanimentSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, linkId, input: body })
  }
}
