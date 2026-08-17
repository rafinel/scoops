import { Get, HttpStatus, Inject } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { GetEstablishmentSettingsUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import {
  CurrentAccount,
  EstablishmentsController,
  RequiredProfiles,
} from '@/identity/decorators'
import { EstablishmentSettingsResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@EstablishmentsController()
export class GetEstablishmentSettingsController {
  private readonly useCase: GetEstablishmentSettingsUseCase

  constructor(@Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase) {
    this.useCase = new GetEstablishmentSettingsUseCase(database)
  }

  @Get('current')
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The current establishment settings were returned.',
    type: EstablishmentSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot access establishment settings.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The current establishment was not found.',
    type: ErrorResponseDto,
  })
  handle(@CurrentAccount() actor: Account) {
    return this.useCase.execute({ actor })
  }
}
