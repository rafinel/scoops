import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { RemoveAccompanimentTypeUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { AccompanimentTypesController } from '@/mrp/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@AccompanimentTypesController()
export class RemoveAccompanimentTypeController {
  private readonly useCase: RemoveAccompanimentTypeUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new RemoveAccompanimentTypeUseCase(database)
  }

  @Delete(':typeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'typeId', format: 'uuid', description: 'The accompaniment type.' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Accompaniment type removed.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The type identifier is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot remove types.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The accompaniment type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The accompaniment type is in use.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('typeId', ParseUUIDPipe) typeId: string,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({ actor, typeId })
  }
}
