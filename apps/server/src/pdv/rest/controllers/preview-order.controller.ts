import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type {
  DiscountsRepository,
  OrderPreviewTokenService,
  SalesCatalogProvider,
  SalesChannelsRepository,
} from '@scoops/core/pdv/interfaces'
import { PreviewOrderUseCase } from '@scoops/core/pdv/use-cases'
import { previewOrderSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import { OrderPreviewResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<Parameters<PreviewOrderUseCase['execute']>[0], 'actor'>

@OrdersController()
export class PreviewOrderController {
  private readonly useCase: PreviewOrderUseCase

  constructor(
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
    @Inject(PDV_REPOSITORIES.salesChannels) salesChannels: SalesChannelsRepository,
    @Inject(PDV_REPOSITORIES.discounts) discounts: DiscountsRepository,
    @Inject(PDV_PROVIDERS.previewToken) tokenService: OrderPreviewTokenService,
  ) {
    this.useCase = new PreviewOrderUseCase(
      catalog,
      salesChannels,
      discounts,
      tokenService,
    )
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order preview returned.',
    type: OrderPreviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot preview orders.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The preview body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The selected order configuration is invalid.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(previewOrderSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<OrderPreviewResponseDto> {
    return this.useCase.execute({ actor, ...body }).then(OrderPreviewResponseDto.from)
  }
}
