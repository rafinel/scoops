import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import { CorrectUserInvitationUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  IdentityDatabase,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '@scoops/core/identity/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserDetailsResponseDto } from '@/identity/rest/dtos'
import { correctUserInvitationSchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import type { Broker } from '@scoops/core/shared/interfaces'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<
  Parameters<CorrectUserInvitationUseCase['execute']>[0],
  'actor' | 'userId'
>

@UsersController()
export class CorrectUserInvitationController {
  private readonly useCase: CorrectUserInvitationUseCase
  private readonly invitationRedirectBaseUrl: string

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    identifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    tokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.userAccessIdentity) provider: UserAccessIdentityProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new CorrectUserInvitationUseCase(
      database,
      datetimeProvider,
      identifierProvider,
      tokenProvider,
      provider,
      broker,
    )
    this.invitationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/invitation/accept`
  }

  @Patch(':userId/invitation')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation corrected.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The invitation was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The invitation cannot be corrected.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(correctUserInvitationSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({
      actor,
      userId,
      ...body,
      invitationRedirectBaseUrl: this.invitationRedirectBaseUrl,
    })
  }
}
