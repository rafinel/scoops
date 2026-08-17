import { Body, HttpStatus, Inject, Patch } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ChangeEstablishmentNameUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { Broker, DatetimeProvider } from '@scoops/core/shared/interfaces'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import {
  CurrentAccount,
  EstablishmentsController,
  RequiredProfiles,
} from '@/identity/decorators'
import { EstablishmentSettingsResponseDto } from '@/identity/rest/dtos'
import { changeIdentityNameSchema } from '@/identity/rest/schemas/change-identity-name-schema'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<Parameters<ChangeEstablishmentNameUseCase['execute']>[0], 'actor'>

@EstablishmentsController()
export class ChangeEstablishmentNameController {
  private readonly useCase: ChangeEstablishmentNameUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ChangeEstablishmentNameUseCase(database, datetimeProvider, broker)
  }

  @Patch('current/name')
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The current establishment name was changed.',
    type: EstablishmentSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot change establishment settings.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The establishment name cannot be changed.',
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
