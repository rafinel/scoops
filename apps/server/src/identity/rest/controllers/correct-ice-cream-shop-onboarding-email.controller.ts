import { Body, HttpStatus, Inject, Patch } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { CorrectIceCreamShopOnboardingEmailUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingIdentityProvider,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { PendingIceCreamShopOnboardingResponseDto } from '@/identity/rest/dtos'
import { correctOnboardingEmailSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<
  Parameters<CorrectIceCreamShopOnboardingEmailUseCase['execute']>[0],
  'confirmationRedirectBaseUrl'
>

@RegistrationAttemptsController()
export class CorrectIceCreamShopOnboardingEmailController {
  // Address correction replaces the pending identity before its new event is published.
  private readonly useCase: CorrectIceCreamShopOnboardingEmailUseCase
  private readonly confirmationRedirectBaseUrl: string

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    onboardingTokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    onboardingIdentifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    onboardingIdentityProvider: OnboardingIdentityProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new CorrectIceCreamShopOnboardingEmailUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingTokenProvider,
      onboardingIdentifierProvider,
      onboardingIdentityProvider,
      broker,
    )
    this.confirmationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/onboarding/confirm`
  }

  @Patch('onboarding/email')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The onboarding email was corrected.',
    type: PendingIceCreamShopOnboardingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The onboarding expired.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The registered password is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The onboarding was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The onboarding is being cleaned up.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Confirmation email rate limited.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The authentication service is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(correctOnboardingEmailSchema)) body: RequestBody,
  ): Promise<PendingIceCreamShopOnboardingResponseDto> {
    return PendingIceCreamShopOnboardingResponseDto.fromDomain(
      await this.useCase.execute({
        ...body,
        confirmationRedirectBaseUrl: this.confirmationRedirectBaseUrl,
      }),
    )
  }
}
