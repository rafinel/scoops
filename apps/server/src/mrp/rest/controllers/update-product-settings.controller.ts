import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiParam, ApiResponse } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { UpdateProductSettingsUseCase } from '@scoops/core/mrp/use-cases'
import type { Broker } from '@scoops/core/shared/interfaces'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductSettingsResponseDto } from '@/mrp/rest/dtos'
import { updateProductSettingsSchema } from '@/mrp/rest/schemas/product-schemas'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Parameters<UpdateProductSettingsUseCase['execute']>[0]['input']

@MrpController()
export class UpdateProductSettingsController {
  private readonly useCase: UpdateProductSettingsUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new UpdateProductSettingsUseCase(database, broker)
  }

  @Patch(':productId/settings')
  @RequiredProfiles([UserProfile.Manager])
  @ApiParam({ name: 'productId', format: 'uuid', description: 'The product to update.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product settings updated.',
    type: ProductSettingsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  async handle(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(updateProductSettingsSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ): Promise<ProductSettingsResponseDto> {
    const details = await this.useCase.execute({ actor, productId, input: body })
    return ProductSettingsResponseDto.from(details)
  }
}
