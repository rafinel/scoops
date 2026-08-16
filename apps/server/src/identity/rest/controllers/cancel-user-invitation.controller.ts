import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import { CancelUserInvitationUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  IdentityDatabase,
  OnboardingIdentifierProvider,
  UserAccessIdentityProvider,
} from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

@UsersController()
export class CancelUserInvitationController {
  private readonly useCase: CancelUserInvitationUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    identifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.userAccessIdentity) provider: UserAccessIdentityProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new CancelUserInvitationUseCase(
      database,
      datetimeProvider,
      identifierProvider,
      provider,
      broker,
    )
  }

  @Delete(':userId/invitation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Invitation cancelled.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The invitation was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The invitation cannot be cancelled.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    return this.useCase.execute({ actor, userId })
  }
}
