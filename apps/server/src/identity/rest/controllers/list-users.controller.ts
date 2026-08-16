import { Get, HttpStatus, Inject, Query as QueryParameter } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ListUsersUseCase } from '@scoops/core/identity/use-cases'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { CurrentAccount, RequiredProfiles, UsersController } from '@/identity/decorators'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { UsersPaginationResponseDto } from '@/identity/rest/dtos'
import { listUsersQuerySchema } from '@/identity/rest/schemas/user-management-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { Account } from '@scoops/core/identity/domain/entities'

type QueryInput = Parameters<ListUsersUseCase['execute']>[0]
type QueryInputWithoutActor = Omit<QueryInput, 'actor'>

@UsersController()
export class ListUsersController {
  private readonly useCase: ListUsersUseCase

  constructor(@Inject(IDENTITY_REPOSITORIES.database) database: IdentityDatabase) {
    this.useCase = new ListUsersUseCase(database)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users returned.',
    type: UsersPaginationResponseDto,
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
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The query is invalid.',
    type: ErrorResponseDto,
  })
  handle(
    @QueryParameter(new ZodValidationPipe(listUsersQuerySchema))
    query: QueryInputWithoutActor,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, ...query })
  }
}
