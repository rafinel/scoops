import { Body, Inject, Patch } from '@nestjs/common'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { ChangeEstablishmentTimezoneUseCase } from '@scoops/core/identity/use-cases'
import { establishmentTimezoneSchema } from '@scoops/validation'
import { z } from 'zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import {
  CurrentAccount,
  EstablishmentsController,
  RequiredProfiles,
} from '@/identity/decorators'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const bodySchema = z.strictObject({ timeZone: establishmentTimezoneSchema })
type RequestBody = z.infer<typeof bodySchema>

@EstablishmentsController()
export class ChangeEstablishmentTimezoneController {
  private readonly useCase: ChangeEstablishmentTimezoneUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(ServerDatetimeProvider) datetime: DatetimeProvider,
  ) {
    this.useCase = new ChangeEstablishmentTimezoneUseCase(database, datetime)
  }

  @Patch('current/timezone')
  @RequiredProfiles([UserProfile.Manager])
  handle(
    @Body(new ZodValidationPipe(bodySchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, timeZone: body.timeZone })
  }
}
