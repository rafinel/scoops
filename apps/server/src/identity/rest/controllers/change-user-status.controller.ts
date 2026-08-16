import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import {
  InactivateUserUseCase,
  ReactivateUserUseCase,
} from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserDetailsResponseDto } from '@/identity/rest/dtos'
import { changeUserStatusSchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

type RequestBody = { status: Extract<UserStatus, 'active' | 'inactive'> }

@UsersController()
export class ChangeUserStatusController {
  private readonly inactivateUser: InactivateUserUseCase
  private readonly reactivateUser: ReactivateUserUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.inactivateUser = new InactivateUserUseCase(database, datetimeProvider, broker)
    this.reactivateUser = new ReactivateUserUseCase(database, datetimeProvider, broker)
  }

  @Patch(':userId/status')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status changed.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The status change is not allowed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The request is invalid.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body(new ZodValidationPipe(changeUserStatusSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return body.status === UserStatus.Inactive
      ? this.inactivateUser.execute({ actor, userId })
      : this.reactivateUser.execute({ actor, userId })
  }
}
