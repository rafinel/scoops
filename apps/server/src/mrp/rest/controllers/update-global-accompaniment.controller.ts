import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { UpdateGlobalAccompanimentUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { GlobalAccompanimentResponseDto } from '@/mrp/rest/dtos'
import { updateGlobalAccompanimentSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<UpdateGlobalAccompanimentUseCase['execute']>[0]['input']

@MrpController()
export class UpdateGlobalAccompanimentController {
  private readonly useCase: UpdateGlobalAccompanimentUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new UpdateGlobalAccompanimentUseCase(database)
  }

  @Patch(':productId/global-accompaniment')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The global Accompaniment product.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['accompanimentTypeId', 'quantityPerPortion'],
      properties: {
        accompanimentTypeId: { type: 'string', format: 'uuid' },
        quantityPerPortion: {
          type: 'number',
          minimum: 0,
          exclusiveMinimum: true,
          multipleOf: 0.001,
        },
        accompanimentPrice: {
          type: 'number',
          minimum: 0,
          maximum: 9_999_999_999_999_998,
          multipleOf: 0.01,
          description:
            'Optional saved product-wide sale price; replaced only when it differs.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The shared type, quantity and price were applied to the global and every Portion row.',
    type: GlobalAccompanimentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The product is not an active Accompaniment eligible for Portions, or the quantity, price or main brand is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot edit global Accompaniments.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product, its global record or the type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The write conflicted. Nothing is saved.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The body is malformed.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(updateGlobalAccompanimentSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<GlobalAccompanimentResponseDto> {
    const details = await this.useCase.execute({ actor, productId, input: body })
    return GlobalAccompanimentResponseDto.from(details)
  }
}
