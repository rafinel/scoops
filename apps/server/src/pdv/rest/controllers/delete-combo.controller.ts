import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { PdvDatabase } from '@scoops/core/pdv/interfaces'
import { RemoveComboUseCase } from '@scoops/core/pdv/use-cases'
import { comboLifecycleSchema } from '@scoops/validation'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { DiscountsController } from '@/pdv/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ZodValidationPipe } from '@/shared/rest/pipes'
import type { Broker } from '@scoops/core/shared/interfaces'

type QueryInput = Omit<Parameters<RemoveComboUseCase['execute']>[0], 'actor' | 'comboId'>

@DiscountsController()
export class DeleteComboController {
  private readonly useCase: RemoveComboUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new RemoveComboUseCase(database, broker)
  }

  @Delete(':discountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'discountId', format: 'uuid', description: 'The Combo to delete.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Combo deleted.' })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The lifecycle query is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot delete Combos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Combo was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The Combo deletion conflicted with a newer version.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('discountId', ParseUUIDPipe) discountId: string,
    @Query(new ZodValidationPipe(comboLifecycleSchema)) query: QueryInput,
    @CurrentAccount() actor: Account,
  ): Promise<void> {
    await this.useCase.execute({
      actor,
      comboId: discountId,
      expectedUpdatedAt: query.expectedUpdatedAt,
    })
  }
}
