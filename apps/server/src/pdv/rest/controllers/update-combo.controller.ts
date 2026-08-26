import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase, SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { ReviseComboUseCase } from '@scoops/core/pdv/use-cases'
import { updateComboSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ComboResponseDto } from '@/pdv/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { Broker } from '@scoops/core/shared/interfaces'

type RequestBody = Parameters<ReviseComboUseCase['execute']>[0]['input']

@DiscountsController()
export class UpdateComboController {
  private readonly useCase: ReviseComboUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ReviseComboUseCase(database, catalog, broker)
  }

  @Patch(':discountId')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'discountId', format: 'uuid', description: 'The Combo to update.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combo updated.',
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
    description: 'The authenticated profile cannot update Combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Combo was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The Combo update conflicted with a newer version.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The product catalog is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @Body(new ZodValidationPipe(updateComboSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<ComboResponseDto> {
    const details = await this.useCase.execute({
      actor,
      comboId: discountId,
      input: body,
    })
    return ComboResponseDto.from(details)
  }
}
