import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { OrdersRepository } from '@scoops/core/pdv/interfaces'
import { GetOrderUseCase } from '@scoops/core/pdv/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import { OrderResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@OrdersController()
export class GetOrderController {
  private readonly useCase: GetOrderUseCase

  constructor(@Inject(PDV_REPOSITORIES.orders) ordersRepository: OrdersRepository) {
    this.useCase = new GetOrderUseCase(ordersRepository)
  }

  @Get(':orderId')
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiParam({ name: 'orderId', format: 'uuid', description: 'The order to read.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order returned.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The order identifier is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read orders.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The order was not found.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentAccount() actor: Account,
  ): Promise<OrderResponseDto> {
    const order = await this.useCase.execute({ actor, orderId })
    return OrderResponseDto.from(order)
  }
}
