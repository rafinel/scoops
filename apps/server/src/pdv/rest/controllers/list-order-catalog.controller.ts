import { Get, HttpStatus, Inject, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { ListOrderCatalogUseCase } from '@scoops/core/pdv/use-cases'
import { orderCatalogQuerySchema } from '@scoops/validation'
import { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import { SalesCatalogProductPageResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type QueryInput = z.infer<typeof orderCatalogQuerySchema>

@OrdersController()
export class ListOrderCatalogController {
  private readonly useCase: ListOrderCatalogUseCase

  constructor(@Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider) {
    this.useCase = new ListOrderCatalogUseCase(catalog)
  }

  @Get('catalog')
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order catalog returned.',
    type: SalesCatalogProductPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot list the order catalog.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The catalog query is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The catalog query is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The product catalog is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Query(new ZodValidationPipe(orderCatalogQuerySchema)) query: QueryInput,
    @CurrentAccount() actor: Account,
  ): Promise<SalesCatalogProductPageResponseDto> {
    const page = await this.useCase.execute({ actor, ...query })
    return SalesCatalogProductPageResponseDto.from(page)
  }
}
