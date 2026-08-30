import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase } from '@scoops/core/pdv/interfaces'
import { CancelOrderUseCase } from '@scoops/core/pdv/use-cases'
import { cancelOrderSchema, type CancelOrderInput } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import { OrderResponseDto } from '@/pdv/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

@OrdersController()
export class CancelOrderController {
  private readonly useCase: CancelOrderUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CancelOrderUseCase(database, datetimeProvider)
  }

  @Patch(':orderId/cancel')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'orderId', format: 'uuid', description: 'The order to cancel.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order canceled.',
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
    description: 'Only managers can cancel orders.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The order was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The order has already been canceled or conflicts with another request.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The cancellation body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'The cancellation was rolled back after an unexpected failure.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The cancellation was rolled back because a dependency is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderInput,
    @CurrentAccount() actor: Account,
  ): Promise<OrderResponseDto> {
    const order = await this.useCase.execute({ actor, orderId, ...body })
    return OrderResponseDto.from(order)
  }
}
