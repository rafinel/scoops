import { Body, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { ConfirmIceCreamShopOnboardingUseCase } from '@scoops/core/identity/use-cases'
import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type {
  IdentityDatabase,
  OnboardingTokenProvider,
} from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAuthUser, RegistrationAttemptsController } from '@/identity/decorators'
import { PendingAuthenticationGuard } from '@/identity/rest/guards/pending-authentication.guard'
import { confirmOnboardingSchema } from '@/identity/rest/schemas/onboarding-schemas'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { PublicRoute } from '@/shared/rest/decorators/public-route'

type RequestBody = Parameters<ConfirmIceCreamShopOnboardingUseCase['execute']>[0]

@RegistrationAttemptsController()
@PublicRoute()
@UseGuards(PendingAuthenticationGuard)
export class ConfirmIceCreamShopOnboardingController {
  private readonly useCase: ConfirmIceCreamShopOnboardingUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingToken)
    onboardingTokenProvider: OnboardingTokenProvider,
  ) {
    this.useCase = new ConfirmIceCreamShopOnboardingUseCase(
      identityDatabase,
      datetimeProvider,
      onboardingTokenProvider,
    )
  }

  @Post('onboarding/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
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
    @CurrentAuthUser() authUser: AuthUser,
  ): Promise<void> {
    await this.useCase.execute({
      providerSubject: authUser.id,
      verifiedEmail: authUser.email,
      confirmationToken: body.confirmationToken,
    })
  }
}
