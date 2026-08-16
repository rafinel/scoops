import { Body, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { InviteUserUseCase } from '@scoops/core/identity/use-cases'
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
import { inviteUserSchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<
  Parameters<InviteUserUseCase['execute']>[0],
  'actor' | 'invitationRedirectBaseUrl'
>

@UsersController()
export class InviteUserController {
  private readonly useCase: InviteUserUseCase
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
    this.useCase = new InviteUserUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )
    this.invitationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/invitation/accept`
  }

  @Post('invitations')
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invitation created.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The email is unavailable.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Invitation email rate limited.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The identity provider is unavailable.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(inviteUserSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({
      actor,
      ...body,
      invitationRedirectBaseUrl: this.invitationRedirectBaseUrl,
    })
  }
}
