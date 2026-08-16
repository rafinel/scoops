import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import { GetUserDetailsUseCase } from '@scoops/core/identity/use-cases'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserDetailsResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@UsersController()
export class GetUserDetailsController {
  private readonly useCase: GetUserDetailsUseCase

  constructor(@Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase) {
    this.useCase = new GetUserDetailsUseCase(database)
  }

  @Get(':userId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details returned.',
    type: UserDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Manager access is required.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, userId })
  }
}
