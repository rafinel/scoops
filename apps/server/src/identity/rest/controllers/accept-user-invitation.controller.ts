import { Body, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { AcceptUserInvitationUseCase } from '@scoops/core/identity/use-cases'
import type { Broker } from '@scoops/core/shared/interfaces'
import type {
  IdentityDatabase,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES, IDENTITY_PROVIDERS } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { acceptUserInvitationSchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { PublicRoute } from '@/shared/rest/decorators/public-route'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import type { Response } from 'express'

type RequestBody = Parameters<AcceptUserInvitationUseCase['execute']>[0]

@RegistrationAttemptsController()
@PublicRoute()
export class AcceptUserInvitationController {
  private readonly useCase: AcceptUserInvitationUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken) tokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    identifierProvider: OnboardingIdentifierProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(IDENTITY_PROVIDERS.userAccessIdentity)
    provider: UserAccessIdentityProvider,
    private readonly sessionIssuer: BetterAuthSessionIssuer,
  ) {
    this.useCase = new AcceptUserInvitationUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )
  }

  @Post('invitation/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Invitation accepted.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The invitation has expired.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The invitation was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The invitation credentials are invalid.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(acceptUserInvitationSchema)) body: RequestBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const authUser = await this.useCase.execute(body)
    await this.sessionIssuer.issueForUser(authUser.id, response)
  }
}
