import { Get, HttpStatus, Inject, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { OrdersRepository } from '@scoops/core/pdv/interfaces'
import { ListOrdersUseCase } from '@scoops/core/pdv/use-cases'
import { orderListQuerySchema, type OrderListQuery } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import { OrderPageResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

@OrdersController()
export class ListOrdersController {
  private readonly useCase: ListOrdersUseCase

  constructor(@Inject(PDV_REPOSITORIES.orders) ordersRepository: OrdersRepository) {
    this.useCase = new ListOrdersUseCase(ordersRepository)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders returned.',
    type: OrderPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot list orders.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The order query is malformed.',
    type: ErrorResponseDto,
  })
  async handle(
    @Query(new ZodValidationPipe(orderListQuerySchema)) query: OrderListQuery,
    @CurrentAccount() actor: Account,
  ): Promise<OrderPageResponseDto> {
    const page = await this.useCase.execute({ actor, ...query })
    return OrderPageResponseDto.from(page)
  }
}
