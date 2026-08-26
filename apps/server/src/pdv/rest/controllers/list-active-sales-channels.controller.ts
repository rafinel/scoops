import { Get, HttpStatus, Inject } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { ListActiveSalesChannelsUseCase } from '@scoops/core/pdv/use-cases'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { SalesChannelsController } from '@/pdv/decorators'
import { SalesChannelResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@SalesChannelsController()
export class ListActiveSalesChannelsController {
  private readonly useCase: ListActiveSalesChannelsUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    salesChannelsRepository: SalesChannelsRepository,
  ) {
    this.useCase = new ListActiveSalesChannelsUseCase(salesChannelsRepository)
  }

  @Get('active')
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sales channels returned.',
    type: SalesChannelResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot list active sales channels.',
    type: ErrorResponseDto,
  })
  async handle(@CurrentAccount() actor: Account): Promise<SalesChannelResponseDto[]> {
    const channels = await this.useCase.execute({ actor })
    return SalesChannelResponseDto.fromMany(channels)
  }
}
