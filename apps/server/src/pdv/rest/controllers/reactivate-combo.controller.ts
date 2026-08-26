import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase, SalesCatalogProvider } from '@scoops/core/pdv/interfaces'
import { ReactivateComboUseCase } from '@scoops/core/pdv/use-cases'
import { comboLifecycleSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ComboResponseDto } from '@/pdv/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { Broker } from '@scoops/core/shared/interfaces'

type RequestBody = Omit<
  Parameters<ReactivateComboUseCase['execute']>[0],
  'actor' | 'comboId'
>

@DiscountsController()
export class ReactivateComboController {
  private readonly useCase: ReactivateComboUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(PDV_PROVIDERS.salesCatalog) catalog: SalesCatalogProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ReactivateComboUseCase(database, catalog, broker)
  }

  @Patch(':discountId/reactivate')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({
    name: 'discountId',
    format: 'uuid',
    description: 'The Combo to reactivate.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Combo reactivated.',
    type: ComboResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The lifecycle body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The Combo cannot be reactivated with current product facts.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot reactivate Combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Combo was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The Combo lifecycle update conflicted.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @Body(new ZodValidationPipe(comboLifecycleSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<ComboResponseDto> {
    const details = await this.useCase.execute({ actor, comboId: discountId, ...body })
    return ComboResponseDto.from(details)
  }
}
