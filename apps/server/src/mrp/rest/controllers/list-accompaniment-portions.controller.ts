import {
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query as QueryParameter,
} from '@nestjs/common'
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { ListAccompanimentPortionsUseCase } from '@scoops/core/mrp/use-cases'
import type { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { AccompanimentPortionsPageResponseDto } from '@/mrp/rest/dtos'
import { listAccompanimentPortionsQuerySchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestQuery = z.infer<typeof listAccompanimentPortionsQuerySchema>

@MrpController()
export class ListAccompanimentPortionsController {
  private readonly useCase: ListAccompanimentPortionsUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new ListAccompanimentPortionsUseCase(database)
  }

  @Get(':productId/portions')
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The Accompaniment product.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Case-insensitive partial Portion name, up to 120 characters.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'One-based page, default 1.' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Rows per page from 1 to 100, default 10.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Portions that have the Accompaniment, ordered by Portion name then link id. A page beyond the last returns the last page.',
    type: AccompanimentPortionsPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The product identifier is malformed or the product is not an Accompaniment eligible for Portions.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The pagination or search query is malformed.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @QueryParameter(new ZodValidationPipe(listAccompanimentPortionsQuerySchema))
    query: RequestQuery,
    @CurrentAccount() actor: Account,
  ): Promise<AccompanimentPortionsPageResponseDto> {
    const page = await this.useCase.execute({ actor, productId, ...query })
    return AccompanimentPortionsPageResponseDto.from(page)
  }
}
