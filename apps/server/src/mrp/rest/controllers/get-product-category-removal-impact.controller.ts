import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { PreviewProductCategoryRemovalUseCase } from '@scoops/core/mrp/use-cases'
import { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductCategoryRemovalImpactResponseDto } from '@/mrp/rest/dtos'
import { productCategoryRemovalQuerySchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestQuery = z.infer<typeof productCategoryRemovalQuerySchema>

@MrpController()
export class GetProductCategoryRemovalImpactController {
  private readonly useCase: PreviewProductCategoryRemovalUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new PreviewProductCategoryRemovalUseCase(database)
  }

  @Get(':productId/category-removal-impact')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The product to inspect.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category removal impact returned.',
    type: ProductCategoryRemovalImpactResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query(new ZodValidationPipe(productCategoryRemovalQuerySchema))
    query: RequestQuery,
    @CurrentAccount() actor: Account,
  ): Promise<ProductCategoryRemovalImpactResponseDto> {
    const impact = await this.useCase.execute({
      actor,
      productId,
      category: query.category,
    })
    return ProductCategoryRemovalImpactResponseDto.from(impact)
  }
}
