import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { UpdateSalesChannelUseCase } from '@scoops/core/pdv/use-cases'
import { saveChannelSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { SalesChannelsController } from '@/pdv/decorators'
import { SalesChannelResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<
  Parameters<UpdateSalesChannelUseCase['execute']>[0],
  'actor' | 'channelId'
>

@SalesChannelsController()
export class UpdateSalesChannelController {
  private readonly useCase: UpdateSalesChannelUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    salesChannelsRepository: SalesChannelsRepository,
  ) {
    this.useCase = new UpdateSalesChannelUseCase(salesChannelsRepository)
  }

  @Patch(':salesChannelId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'salesChannelId',
    format: 'uuid',
    description: 'The sales channel to update.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales channel updated.',
    type: SalesChannelResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The sales channel body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot update sales channels.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The sales channel was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The sales channel name is already in use.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('salesChannelId', ParseUUIDPipe) salesChannelId: string,
    @Body(new ZodValidationPipe(saveChannelSchema.omit({ status: true })))
    body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<SalesChannelResponseDto> {
    return this.useCase
      .execute({ actor, channelId: salesChannelId, ...body })
      .then(SalesChannelResponseDto.from)
  }
}
