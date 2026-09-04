import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { emailSchema } from '@scoops/validation'
import { z } from 'zod'
import { RequestPasswordRecoveryUseCase } from '@scoops/core/identity/use-cases'
import type {
  IdentityDatabase,
  ServerAuthProvider,
} from '@scoops/core/identity/interfaces'
type PasswordRecoveryIdentityProvider = Pick<
  ServerAuthProvider,
  'preparePasswordRecovery' | 'resetPassword'
>
import type { Broker } from '@scoops/core/shared/interfaces'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { RegistrationAttemptsController } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { PublicRoute } from '@/shared/rest/decorators/public-route'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

const requestPasswordRecoverySchema = z.object({ email: emailSchema }).strict()
type RequestBody = z.infer<typeof requestPasswordRecoverySchema>

@RegistrationAttemptsController()
@PublicRoute()
export class RequestPasswordRecoveryController {
  private readonly useCase: RequestPasswordRecoveryUseCase
  private readonly recoveryRedirectBaseUrl: string

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(IDENTITY_PROVIDERS.onboardingIdentity)
    provider: PasswordRecoveryIdentityProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.useCase = new RequestPasswordRecoveryUseCase(
      database,
      datetimeProvider,
      provider,
      broker,
    )
    this.recoveryRedirectBaseUrl = `${envProvider.get('SCOOPS_WEB_APP_URL')}/reset-password`
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Recovery request accepted.' })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Recovery message rate limited.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(requestPasswordRecoverySchema)) body: RequestBody,
  ): Promise<void> {
    await this.useCase.execute({
      email: body.email,
      recoveryRedirectTo: this.recoveryRedirectBaseUrl,
    })
  }
}
