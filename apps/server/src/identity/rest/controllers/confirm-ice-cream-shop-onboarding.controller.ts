import { Body, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ConfirmIceCreamShopOnboardingUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  OnboardingIdentityProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { confirmOnboardingSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { PublicRoute } from '@/shared/rest/decorators/public-route'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import type { Response } from 'express'

type RequestBody = Parameters<ConfirmIceCreamShopOnboardingUseCase['execute']>[0]

@RegistrationAttemptsController()
@PublicRoute()
export class ConfirmIceCreamShopOnboardingController {
  private readonly useCase: ConfirmIceCreamShopOnboardingUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    onboardingIdentityProvider: OnboardingIdentityProvider,
    private readonly sessionIssuer: BetterAuthSessionIssuer,
  ) {
    this.useCase = new ConfirmIceCreamShopOnboardingUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingIdentityProvider,
    )
  }

  @Post('onboarding/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Onboarding confirmed.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The onboarding link expired or is stale.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'A valid provider session is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The onboarding was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The confirmation token is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The authentication service is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(confirmOnboardingSchema)) body: Pick<
      RequestBody,
      'confirmationToken'
    >,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const authUser = await this.useCase.execute(body)
    await this.sessionIssuer.issueForUser(authUser.id, response)
  }
}
