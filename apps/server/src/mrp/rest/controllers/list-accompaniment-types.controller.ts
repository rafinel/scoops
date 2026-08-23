import { Get, HttpStatus, Inject, Query as QueryParameter } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { AccompanimentTypesRepository } from '@scoops/core/mrp/interfaces'
import { ListAccompanimentTypesUseCase } from '@scoops/core/mrp/use-cases'
import { z } from 'zod'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { AccompanimentTypesController } from '@/mrp/decorators'
import { AccompanimentTypePageResponseDto } from '@/mrp/rest/dtos'
import { listAccompanimentTypesQuerySchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type QueryInput = z.infer<typeof listAccompanimentTypesQuerySchema>

@AccompanimentTypesController()
export class ListAccompanimentTypesController {
  private readonly useCase: ListAccompanimentTypesUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.accompanimentTypes)
    accompanimentTypesRepository: AccompanimentTypesRepository,
  ) {
    this.useCase = new ListAccompanimentTypesUseCase(accompanimentTypesRepository)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accompaniment types returned.',
    type: AccompanimentTypePageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The pagination query is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot list accompaniment types.',
    type: ErrorResponseDto,
  })
  handle(
    @QueryParameter(new ZodValidationPipe(listAccompanimentTypesQuerySchema))
    query: QueryInput,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, ...query })
  }
}
