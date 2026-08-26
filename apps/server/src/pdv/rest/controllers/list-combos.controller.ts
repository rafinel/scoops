import { Get, HttpStatus, Inject, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase, SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { ListCombosUseCase } from '@scoops/core/pdv/use-cases'
import { comboListQuerySchema } from '@scoops/validation'
import { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ComboPageResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type QueryInput = z.infer<typeof comboListQuerySchema>

@DiscountsController()
export class ListCombosController {
  private readonly useCase: ListCombosUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
  ) {
    this.useCase = new ListCombosUseCase(database, catalog)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combos returned.',
    type: ComboPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot list combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The query parameters are malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The query parameters are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The product catalog is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Query(new ZodValidationPipe(comboListQuerySchema)) query: QueryInput,
    @CurrentAccount() actor: Account,
  ): Promise<ComboPageResponseDto> {
    const page = await this.useCase.execute({ actor, ...query })
    return ComboPageResponseDto.from(page)
  }
}
