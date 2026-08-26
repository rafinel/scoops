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
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { DeleteSalesChannelUseCase } from '@scoops/core/pdv/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { SalesChannelsController } from '@/pdv/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@SalesChannelsController()
export class DeleteSalesChannelController {
  private readonly useCase: DeleteSalesChannelUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    salesChannelsRepository: SalesChannelsRepository,
  ) {
    this.useCase = new DeleteSalesChannelUseCase(salesChannelsRepository)
  }

  @Delete(':salesChannelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'salesChannelId',
    format: 'uuid',
    description: 'The sales channel to delete.',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Sales channel deleted.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot delete sales channels.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The sales channel was not found.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('salesChannelId', ParseUUIDPipe) salesChannelId: string,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({ actor, channelId: salesChannelId })
  }
}
