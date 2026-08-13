import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ResendIceCreamShopConfirmationUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingIdentityProvider,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { PendingIceCreamShopOnboardingResponseDto } from '@/identity/rest/dtos'
import { onboardingTokenSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<ResendIceCreamShopConfirmationUseCase['execute']>[0]

@RegistrationAttemptsController()
export class ResendIceCreamShopConfirmationController {
  private readonly useCase: ResendIceCreamShopConfirmationUseCase
  private readonly confirmationRedirectBaseUrl: string

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    onboardingTokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    onboardingIdentityProvider: OnboardingIdentityProvider,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new ResendIceCreamShopConfirmationUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingTokenProvider,
      onboardingIdentityProvider,
    )
    this.confirmationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/onboarding/confirm`
  }

  @Post('onboarding/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Confirmation resent.',
    type: PendingIceCreamShopOnboardingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The onboarding expired.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The onboarding was not found.',
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
    @Body(new ZodValidationPipe(onboardingTokenSchema)) body: Omit<
      RequestBody,
      'confirmationRedirectBaseUrl'
    >,
  ): Promise<PendingIceCreamShopOnboardingResponseDto> {
    return PendingIceCreamShopOnboardingResponseDto.fromDomain(
      await this.useCase.execute({
        ...body,
        confirmationRedirectBaseUrl: this.confirmationRedirectBaseUrl,
      }),
    )
  }
}
