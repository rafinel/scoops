import { Body, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase, SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { RegisterComboUseCase } from '@scoops/core/pdv/use-cases'
import { saveComboSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ComboResponseDto } from '@/pdv/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { Broker } from '@scoops/core/shared/interfaces'

type RequestBody = Omit<Parameters<RegisterComboUseCase['execute']>[0], 'actor'>

@DiscountsController()
export class CreateComboController {
  private readonly useCase: RegisterComboUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new RegisterComboUseCase(database, catalog, broker)
  }

  @Post()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Combo created.',
    type: ComboResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The Combo body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The Combo definition is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot create Combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The Combo name is already in use.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The product catalog is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(saveComboSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<ComboResponseDto> {
    const details = await this.useCase.execute({ actor, ...body })
    return ComboResponseDto.from(details)
  }
}
