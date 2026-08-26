import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase, SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { GetComboUseCase } from '@scoops/core/pdv/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ComboResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@DiscountsController()
export class GetComboController {
  private readonly useCase: GetComboUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
  ) {
    this.useCase = new GetComboUseCase(database, catalog)
  }

  @Get(':discountId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'discountId', format: 'uuid', description: 'The Combo to read.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combo returned.',
    type: ComboResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The Combo identifier is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read Combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Combo was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The product catalog is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @CurrentAccount() actor: Account,
  ): Promise<ComboResponseDto> {
    const details = await this.useCase.execute({ actor, comboId: discountId })
    return ComboResponseDto.from(details)
  }
}
