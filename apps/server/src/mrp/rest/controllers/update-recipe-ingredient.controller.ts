import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { UpdateRecipeIngredientUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { RecipeResponseDto } from '@/mrp/rest/dtos'
import { updateRecipeIngredientSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<UpdateRecipeIngredientUseCase['execute']>[0]['input']

@MrpController()
export class UpdateRecipeIngredientController {
  private readonly useCase: UpdateRecipeIngredientUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new UpdateRecipeIngredientUseCase(database)
  }

  @Patch(':productId/recipe/ingredients/:lineId')
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
    status: HttpStatus.OK,
    description: 'Recipe ingredient updated.',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The recipe or ingredient quantity is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot update ingredients.',
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
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body(new ZodValidationPipe(updateRecipeIngredientSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, lineId, input: body })
  }
}
