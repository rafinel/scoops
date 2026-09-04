import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { GetIceCreamShopOnboardingUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { PendingIceCreamShopOnboardingResponseDto } from '@/identity/rest/dtos'
import { onboardingTokenSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<GetIceCreamShopOnboardingUseCase['execute']>[0]

@RegistrationAttemptsController()
export class GetIceCreamShopOnboardingController {
  // Pending onboarding uses a one-time Scoops token, never a provider access token.
  private readonly useCase: GetIceCreamShopOnboardingUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    onboardingTokenProvider: OnboardingTokenProvider,
  ) {
    this.useCase = new GetIceCreamShopOnboardingUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingTokenProvider,
    )
  }

  @Post('onboarding/status')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending onboarding returned.',
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
  async handle(
    @Body(new ZodValidationPipe(onboardingTokenSchema)) body: RequestBody,
  ): Promise<PendingIceCreamShopOnboardingResponseDto> {
    return PendingIceCreamShopOnboardingResponseDto.fromDomain(
      await this.useCase.execute(body),
    )
  }
}
