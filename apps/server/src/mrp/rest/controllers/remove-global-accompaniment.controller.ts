import {
  Delete,
  HttpCode,
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
import { RemoveGlobalAccompanimentUseCase } from '@scoops/core/mrp/use-cases'
import type { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { removeGlobalAccompanimentQuerySchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestQuery = z.infer<typeof removeGlobalAccompanimentQuerySchema>

@MrpController()
export class RemoveGlobalAccompanimentController {
  private readonly useCase: RemoveGlobalAccompanimentUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new RemoveGlobalAccompanimentUseCase(database)
  }

  @Delete(':productId/global-accompaniment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The global Accompaniment product.',
  })
  @ApiQuery({
    name: 'keepPortionLinks',
    required: false,
    enum: ['true', 'false'],
    description:
      'false (default) removes every Portion row and the global. true ends global status and keeps every current row as an individual link; it also works for an inactive product or a global without rows.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The global Accompaniment was removed.',
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
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot remove global Accompaniments.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product or its global record was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The write conflicted. Nothing is changed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The keepPortionLinks query is invalid.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @QueryParameter(new ZodValidationPipe(removeGlobalAccompanimentQuerySchema))
    query: RequestQuery,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({
      actor,
      productId,
      keepPortionLinks: query.keepPortionLinks,
    })
  }
}
