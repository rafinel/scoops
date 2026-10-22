import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common'
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { LinkAccompanimentPortionsUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { AccompanimentPortionResponseDto } from '@/mrp/rest/dtos'
import { linkAccompanimentPortionsSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<LinkAccompanimentPortionsUseCase['execute']>[0]['input']

@MrpController()
export class LinkAccompanimentPortionsController {
  private readonly useCase: LinkAccompanimentPortionsUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new LinkAccompanimentPortionsUseCase(database)
  }

  @Post(':productId/portions')
  @HttpCode(HttpStatus.CREATED)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The Accompaniment product.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['accompanimentTypeId', 'quantityPerPortion'],
      properties: {
        portionProductIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          maxItems: 500,
          uniqueItems: true,
          description:
            'Portions to link or restore. Required unless isGlobal makes a non-global Accompaniment global, where it must be omitted or empty.',
        },
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
            'Optional saved product-wide sale price. Required when none is saved yet; zero is allowed.',
        },
        isGlobal: {
          type: 'boolean',
          description:
            'true without Portions makes a non-global Accompaniment global for every Portion; true with Portions restores excluded Portions of a global; required for a global Accompaniment.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The created rows, or every converted and created row when the Accompaniment becomes global.',
    type: AccompanimentPortionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The product is not an active Accompaniment eligible for Portions, the selection does not match the mode, no Portion is registered, or the quantity, price or main brand is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot link Portions.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product, a Portion or the type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'A Portion is no longer available, the Accompaniment is global and isGlobal was omitted, or the write conflicted. Nothing is saved.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The body is malformed, repeats a Portion or exceeds 500 Portions.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(linkAccompanimentPortionsSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<AccompanimentPortionResponseDto[]> {
    const rows = await this.useCase.execute({ actor, productId, input: body })
    return rows.map(AccompanimentPortionResponseDto.from)
  }
}
