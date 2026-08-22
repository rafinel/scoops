import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { RemoveRecipeIngredientUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class RemoveRecipeIngredientController {
  private readonly useCase: RemoveRecipeIngredientUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new RemoveRecipeIngredientUseCase(database)
  }

  @Delete(':productId/recipe/ingredients/:lineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The manufacturable product.',
  })
  @ApiParam({
    name: 'lineId',
    format: 'uuid',
    description: 'The recipe ingredient line.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Recipe ingredient removed.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product or line identifier is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot remove ingredients.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product, recipe, or ingredient line was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The recipe write conflicted.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({ actor, productId, lineId })
  }
}
