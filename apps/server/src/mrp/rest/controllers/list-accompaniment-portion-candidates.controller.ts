import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { ListAccompanimentPortionCandidatesUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { AccompanimentPortionCandidateResponseDto } from '@/mrp/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class ListAccompanimentPortionCandidatesController {
  private readonly useCase: ListAccompanimentPortionCandidatesUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new ListAccompanimentPortionCandidatesUseCase(database)
  }

  @Get(':productId/portions/candidates')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The Accompaniment product.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Every Portion product of any status without a row for the Accompaniment, ordered by name.',
    type: AccompanimentPortionCandidateResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The product identifier is malformed or the product is not an Accompaniment eligible for Portions.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read Portion candidates.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The product was not found.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentAccount() actor: Account,
  ): Promise<AccompanimentPortionCandidateResponseDto[]> {
    const candidates = await this.useCase.execute({ actor, productId })
    return candidates.map(AccompanimentPortionCandidateResponseDto.from)
  }
}
