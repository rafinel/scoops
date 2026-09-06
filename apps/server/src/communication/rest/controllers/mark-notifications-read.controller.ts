import { Body, HttpStatus, Inject, Patch } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import { MarkNotificationsReadUseCase } from '@scoops/core/communication/use-cases'
import {
  markNotificationsReadSchema,
  type MarkNotificationsReadInput,
} from '@scoops/validation'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import { NotificationsController } from '@/communication/decorators'
import { NotificationReadResponseDto } from '@/communication/rest/dtos'
import { CurrentAccount } from '@/communication/rest/decorators'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

@NotificationsController()
export class MarkNotificationsReadController {
  private readonly useCase: MarkNotificationsReadUseCase

  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    notificationsRepository: NotificationsRepository,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new MarkNotificationsReadUseCase(
      notificationsRepository,
      datetimeProvider,
    )
  }

  @Patch('read')
  @ApiResponse({ status: HttpStatus.OK, type: NotificationReadResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ErrorResponseDto })
  async handle(
    @Body(new ZodValidationPipe(markNotificationsReadSchema))
    body: MarkNotificationsReadInput,
    @CurrentAccount() actor: Account,
  ): Promise<NotificationReadResponseDto> {
    return NotificationReadResponseDto.from(
      await this.useCase.execute({ actor, notificationIds: body.notificationIds }),
    )
  }
}
