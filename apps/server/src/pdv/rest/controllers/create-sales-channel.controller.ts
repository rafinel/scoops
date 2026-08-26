import { Body, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { CreateSalesChannelUseCase } from '@scoops/core/pdv/use-cases'
import { saveChannelSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { SalesChannelsController } from '@/pdv/decorators'
import { SalesChannelResponseDto } from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<Parameters<CreateSalesChannelUseCase['execute']>[0], 'actor'>

@SalesChannelsController()
export class CreateSalesChannelController {
  private readonly useCase: CreateSalesChannelUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    salesChannelsRepository: SalesChannelsRepository,
  ) {
    this.useCase = new CreateSalesChannelUseCase(salesChannelsRepository)
  }

  @Post()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sales channel created.',
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
    description: 'The authenticated profile cannot create sales channels.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The sales channel name is already in use.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(saveChannelSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<SalesChannelResponseDto> {
    return this.useCase.execute({ actor, ...body }).then(SalesChannelResponseDto.from)
  }
}
