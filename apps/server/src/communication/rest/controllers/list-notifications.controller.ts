import { Get, HttpStatus, Inject, Query } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { ListNotificationsUseCase } from '@scoops/core/communication/use-cases'
import {
  notificationListQuerySchema,
  type NotificationListQuery,
} from '@scoops/validation'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import { NotificationsController } from '@/communication/decorators'
import { NotificationPageResponseDto } from '@/communication/rest/dtos'
import { CurrentAccount } from '@/communication/rest/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'

@NotificationsController()
export class ListNotificationsController {
  private readonly useCase: ListNotificationsUseCase

  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    notificationsRepository: NotificationsRepository,
  ) {
    this.useCase = new ListNotificationsUseCase(notificationsRepository)
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: NotificationPageResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorResponseDto })
  async handle(
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query: NotificationListQuery,
    @CurrentAccount() actor: Account,
  ): Promise<NotificationPageResponseDto> {
    const page = await this.useCase.execute({
      actor,
      limit: query.limit,
      ...(query.occurredFrom === undefined ? {} : { occurredFrom: query.occurredFrom }),
      ...(query.occurredTo === undefined ? {} : { occurredTo: query.occurredTo }),
      ...(query.cursorOccurredAt === undefined || query.cursorId === undefined
        ? {}
        : { cursor: { occurredAt: query.cursorOccurredAt, id: query.cursorId } }),
    })
    return NotificationPageResponseDto.from(page)
  }
}
