import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common'
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { AccompanimentRemovalScope } from '@scoops/core/mrp/domain/structures'
import { RemoveProductAccompanimentUseCase } from '@scoops/core/mrp/use-cases'
import type { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { removeProductAccompanimentQuerySchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestQuery = z.infer<typeof removeProductAccompanimentQuerySchema>

@MrpController()
export class RemoveProductAccompanimentController {
  private readonly useCase: RemoveProductAccompanimentUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new RemoveProductAccompanimentUseCase(database)
  }

  @Delete(':productId/accompaniments/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The Portion product.' })
  @ApiParam({ name: 'linkId', format: 'uuid', description: 'The accompaniment link.' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: Object.values(AccompanimentRemovalScope),
    description:
      'portion (default) removes only this Portion row; all removes every row of a global accompaniment and the global itself.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product accompaniment removed.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'A product or link identifier is malformed, or scope=all was requested for an individual link.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The scope query is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot remove accompaniments.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product or link was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The accompaniment removal conflicted.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Query(new ZodValidationPipe(removeProductAccompanimentQuerySchema))
    query: RequestQuery,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({ actor, productId, linkId, scope: query.scope })
  }
}
