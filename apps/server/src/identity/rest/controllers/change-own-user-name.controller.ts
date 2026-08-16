import { Body, HttpStatus, Inject, Patch } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ChangeOwnUserNameUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { Broker, DatetimeProvider } from '@scoops/core/shared/interfaces'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { AuthController, CurrentAccount } from '@/identity/decorators'
import { AccountResponseDto } from '@/identity/rest/dtos'
import { changeIdentityNameSchema } from '@/identity/rest/schemas/change-identity-name-schema'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<Parameters<ChangeOwnUserNameUseCase['execute']>[0], 'actor'>

@AuthController()
export class ChangeOwnUserNameController {
  private readonly useCase: ChangeOwnUserNameUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ChangeOwnUserNameUseCase(database, datetimeProvider, broker)
  }

  @Patch('session/name')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The authenticated user name was changed.',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The authenticated user name cannot be changed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The name request is invalid.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(changeIdentityNameSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, ...body })
  }
}
