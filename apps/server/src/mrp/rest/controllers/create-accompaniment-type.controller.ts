import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { CreateAccompanimentTypeUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { AccompanimentTypesController } from '@/mrp/decorators'
import { AccompanimentTypeResponseDto } from '@/mrp/rest/dtos'
import { saveAccompanimentTypeSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<Parameters<CreateAccompanimentTypeUseCase['execute']>[0], 'actor'>

@AccompanimentTypesController()
export class CreateAccompanimentTypeController {
  private readonly useCase: CreateAccompanimentTypeUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new CreateAccompanimentTypeUseCase(database)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Accompaniment type created.',
    type: AccompanimentTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The type body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot create types.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The type name is already in use.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(saveAccompanimentTypeSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, name: body.name })
  }
}
