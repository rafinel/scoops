import { Body, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { AcceptUserInvitationUseCase } from '@scoops/core/identity/use-cases'
import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type { Broker } from '@scoops/core/shared/interfaces'
import type {
  IdentityDatabase,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES, IDENTITY_PROVIDERS } from '@/identity/constants'
import { CurrentAuthUser, RegistrationAttemptsController } from '@/identity/decorators'
import { PendingAuthenticationGuard } from '@/identity/rest/guards/pending-authentication.guard'
import { acceptUserInvitationSchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Parameters<AcceptUserInvitationUseCase['execute']>[0]

@RegistrationAttemptsController()
@UseGuards(PendingAuthenticationGuard)
export class AcceptUserInvitationController {
  private readonly useCase: AcceptUserInvitationUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken) tokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    identifierProvider: OnboardingIdentifierProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new AcceptUserInvitationUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      broker,
    )
  }

  @Post('invitation/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
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
    description: 'A valid invitation session is required.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(acceptUserInvitationSchema)) body: Pick<
      RequestBody,
      'confirmationToken'
    >,
    @CurrentAuthUser() authUser: AuthUser,
  ): Promise<void> {
    return this.useCase.execute({ authUser, confirmationToken: body.confirmationToken })
  }
}
