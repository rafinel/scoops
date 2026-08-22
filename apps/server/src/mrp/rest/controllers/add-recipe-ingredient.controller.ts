import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { AddRecipeIngredientUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { RecipeResponseDto } from '@/mrp/rest/dtos'
import { addRecipeIngredientSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<AddRecipeIngredientUseCase['execute']>[0]['input']

@MrpController()
export class AddRecipeIngredientController {
  private readonly useCase: AddRecipeIngredientUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new AddRecipeIngredientUseCase(database)
  }

  @Post(':productId/recipe/ingredients')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The manufacturable product.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recipe ingredient added.',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The recipe or ingredient is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot add ingredients.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product or ingredient was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The ingredient already belongs to the recipe.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(addRecipeIngredientSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, input: body })
  }
}
