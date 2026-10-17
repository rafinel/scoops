import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { ListProductAccompanimentCandidatesUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductAccompanimentCandidateResponseDto } from '@/mrp/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class ListProductAccompanimentCandidatesController {
  private readonly useCase: ListProductAccompanimentCandidatesUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new ListProductAccompanimentCandidatesUseCase(database)
  }

  @Get(':productId/accompaniments/candidates')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The Portion product.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Eligible Accompaniment products absent from the Portion, ordered by name, with global and individual-link facts.',
    type: ProductAccompanimentCandidateResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product or its identifier is not a valid Portion.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot read accompaniment candidates.',
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
  ): Promise<ProductAccompanimentCandidateResponseDto[]> {
    const candidates = await this.useCase.execute({ actor, productId })
    return candidates.map(ProductAccompanimentCandidateResponseDto.from)
  }
}
