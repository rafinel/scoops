import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { GetProductSettingsUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductSettingsResponseDto } from '@/mrp/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class GetProductSettingsController {
  private readonly useCase: GetProductSettingsUseCase

  constructor(@Inject(MRP_REPOSITORIES.products) productsRepository: ProductsRepository) {
    this.useCase = new GetProductSettingsUseCase(productsRepository)
  }

  @Get(':productId/settings')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The product to read.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product settings returned.',
    type: ProductSettingsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentAccount() actor: Account,
  ): Promise<ProductSettingsResponseDto> {
    const details = await this.useCase.execute({ actor, productId })
    return ProductSettingsResponseDto.from(details)
  }
}
