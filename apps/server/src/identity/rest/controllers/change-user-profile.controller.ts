import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger'
import type { UserDetails } from '@scoops/core/identity/domain/structures'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { ChangeUserProfileUseCase } from '@scoops/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserDetailsResponseDto } from '@/identity/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes/zod-validation.pipe'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'
import { changeUserProfileSchema } from '@/identity/rest/schemas/change-user-profile-schema'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = Omit<
  Parameters<ChangeUserProfileUseCase['execute']>[0],
  'actor' | 'userId'
>

@UsersController()
export class ChangeUserProfileController {
  private readonly useCase: ChangeUserProfileUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database)
    identityDatabase: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ChangeUserProfileUseCase(
      identityDatabase,
      datetimeProvider,
      broker,
    )
  }

  @Patch(':userId/profile')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'userId',
    format: 'uuid',
    description: 'The user whose profile is changed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['profile'],
      properties: {
        profile: { enum: Object.values(UserProfile), type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user profile was changed.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot perform this action.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found in the establishment.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The profile change conflicts with an identity invariant.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The profile request is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The authentication service is temporarily unavailable.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(changeUserProfileSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<UserDetails> {
    return this.useCase.execute({ actor, userId, ...body })
  }
}
