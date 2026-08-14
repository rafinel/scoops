import { Body, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiBody, ApiResponse } from '@nestjs/swagger'
import { RegisterIceCreamShopUseCase } from '@scoops/core/identity/use-cases'
import type {
  OnboardingIdentityProvider,
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  IdentityDatabase,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { IceCreamShopOnboardingRegistrationResponseDto } from '@/identity/rest/dtos'
import { registerIceCreamShopOnboardingSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<RegisterIceCreamShopUseCase['execute']>[0],
  'confirmationRedirectBaseUrl'
>

@RegistrationAttemptsController()
export class RegisterIceCreamShopOnboardingController {
  private readonly useCase: RegisterIceCreamShopUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    onboardingTokenProvider: OnboardingTokenProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentifier)
    onboardingIdentifierProvider: OnboardingIdentifierProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    onboardingIdentityProvider: OnboardingIdentityProvider,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new RegisterIceCreamShopUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingTokenProvider,
      onboardingIdentifierProvider,
      onboardingIdentityProvider,
    )
    this.confirmationRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/onboarding/confirm`
  }

  private readonly confirmationRedirectBaseUrl: string

  @Post('onboarding')
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Onboarding started.',
    type: IceCreamShopOnboardingRegistrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The email cannot be used.',
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
    @Body(new ZodValidationPipe(registerIceCreamShopOnboardingSchema)) body: RequestBody,
  ): Promise<IceCreamShopOnboardingRegistrationResponseDto> {
    const registration = await this.useCase.execute({
      ...body,
      confirmationRedirectBaseUrl: this.confirmationRedirectBaseUrl,
    })
    return IceCreamShopOnboardingRegistrationResponseDto.fromDomain(registration)
  }
}
