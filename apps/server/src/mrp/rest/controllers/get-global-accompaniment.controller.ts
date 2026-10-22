import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { GetGlobalAccompanimentUseCase } from '@scoops/core/mrp/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { GlobalAccompanimentResponseDto } from '@/mrp/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@MrpController()
export class GetGlobalAccompanimentController {
  private readonly useCase: GetGlobalAccompanimentUseCase

  constructor(@Inject(MRP_REPOSITORIES.database) database: MrpDatabase) {
    this.useCase = new GetGlobalAccompanimentUseCase(database)
  }

  @Get(':productId/global-accompaniment')
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'The Accompaniment product.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Whether the Accompaniment is global; the shared type, quantity, brand and cost are present only when it is.',
    type: GlobalAccompanimentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The product identifier is malformed or the product is not an Accompaniment.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
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
  ): Promise<GlobalAccompanimentResponseDto> {
    const details = await this.useCase.execute({ actor, productId })
    return GlobalAccompanimentResponseDto.from(details)
  }
}
