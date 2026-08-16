import { HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import { ResendUserInvitationUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  IdentityDatabase,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserDetailsResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

@UsersController()
export class ResendUserInvitationController {
  private readonly useCase: ResendUserInvitationUseCase
  private readonly invitationRedirectBaseUrl: string

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken) tokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    identifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.userAccessIdentity) provider: UserAccessIdentityProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new ResendUserInvitationUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )
    this.invitationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/invitation/accept`
  }

  @Post(':userId/invitation/resend')
  @HttpCode(HttpStatus.OK)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation resent.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The invitation was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The invitation has expired.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Invitation email rate limited.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({
      actor,
      userId,
      invitationRedirectBaseUrl: this.invitationRedirectBaseUrl,
    })
  }
}
