import { Body, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { resetPasswordSchema } from '@scoops/validation'
import { ResetPasswordUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  ServerAuthProvider,
} from '@scoops/core/identity/interfaces'
type PasswordRecoveryIdentityProvider = Pick<
  ServerAuthProvider,
  'preparePasswordRecovery' | 'resetPassword'
>

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { PublicRoute } from '@/shared/rest/decorators/public-route'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import type { Response } from 'express'

type RequestBody = Parameters<ResetPasswordUseCase['execute']>[0]

@RegistrationAttemptsController()
@PublicRoute()
export class ResetPasswordController {
  private readonly useCase: ResetPasswordUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    provider: PasswordRecoveryIdentityProvider,
    private readonly sessionIssuer: BetterAuthSessionIssuer,
  ) {
    this.useCase = new ResetPasswordUseCase(database, provider)
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Password reset.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The reset token is invalid or expired.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: RequestBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.useCase.execute(body)
    this.sessionIssuer.expireSession(response)
  }
}
