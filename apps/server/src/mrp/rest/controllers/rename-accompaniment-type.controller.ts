import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { RenameAccompanimentTypeUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { AccompanimentTypesController } from '@/mrp/decorators'
import { AccompanimentTypeResponseDto } from '@/mrp/rest/dtos'
import { saveAccompanimentTypeSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<
  Parameters<RenameAccompanimentTypeUseCase['execute']>[0],
  'actor' | 'typeId'
>

@AccompanimentTypesController()
export class RenameAccompanimentTypeController {
  private readonly useCase: RenameAccompanimentTypeUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new RenameAccompanimentTypeUseCase(database)
  }

  @Patch(':typeId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'typeId', format: 'uuid', description: 'The accompaniment type.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accompaniment type renamed.',
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
    description: 'The authenticated profile cannot rename types.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The accompaniment type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The type name is already in use.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('typeId', ParseUUIDPipe) typeId: string,
    @Body(new ZodValidationPipe(saveAccompanimentTypeSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, typeId, name: body.name })
  }
}
