import { HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { InactivateSalesChannelUseCase } from '@scoops/core/pdv/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { SalesChannelsController } from '@/pdv/decorators'
import { SalesChannelResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@SalesChannelsController()
export class InactivateSalesChannelController {
  private readonly useCase: InactivateSalesChannelUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    salesChannelsRepository: SalesChannelsRepository,
  ) {
    this.useCase = new InactivateSalesChannelUseCase(salesChannelsRepository)
  }

  @Patch(':salesChannelId/inactivate')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'salesChannelId',
    format: 'uuid',
    description: 'The sales channel to inactivate.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales channel inactivated.',
    type: SalesChannelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot inactivate sales channels.',
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
  ): Promise<SalesChannelResponseDto> {
    const channel = await this.useCase.execute({ actor, channelId: salesChannelId })
    return SalesChannelResponseDto.from(channel)
  }
}
