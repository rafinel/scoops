import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Put } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { SaveRecipeYieldUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { RecipeResponseDto } from '@/mrp/rest/dtos'
import { recipeYieldSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<SaveRecipeYieldUseCase['execute']>[0]['input']

@MrpController()
export class SaveRecipeYieldController {
  private readonly useCase: SaveRecipeYieldUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new SaveRecipeYieldUseCase(database)
  }

  @Put(':productId/recipe')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The manufacturable product.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recipe yield saved.',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product is not manufacturable or the yield is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot save recipes.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The recipe write conflicted.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(recipeYieldSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, productId, input: body })
  }
}
