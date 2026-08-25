import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { PreviewProductUnitChangeUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductUnitChangePreviewResponseDto } from '@/mrp/rest/dtos'
import { previewProductUnitChangeSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<PreviewProductUnitChangeUseCase['execute']>[0]['input']

@MrpController()
export class PreviewProductUnitChangeController {
  private readonly useCase: PreviewProductUnitChangeUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new PreviewProductUnitChangeUseCase(database)
  }

  @Post(':productId/unit-change-preview')
  @HttpCode(HttpStatus.OK)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The product to inspect.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product unit change preview returned.',
    type: ProductUnitChangePreviewResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(previewProductUnitChangeSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<ProductUnitChangePreviewResponseDto> {
    const preview = await this.useCase.execute({ actor, productId, input: body })
    return ProductUnitChangePreviewResponseDto.from(preview)
  }
}
