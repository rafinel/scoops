import { Body, HttpStatus, Inject, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { RegisterProductUseCase } from '@scoops/core/mrp/use-cases'
import type { Broker } from '@scoops/core/shared/interfaces'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { Account } from '@scoops/core/identity/domain/entities'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { ProductResponseDto } from '@/mrp/rest/dtos'
import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

import { registerProductSchema } from '../schemas/product-schemas'

type RequestBody = Omit<Parameters<RegisterProductUseCase['execute']>[0], 'actor'>

@MrpController()
export class RegisterProductController {
  private readonly useCase: RegisterProductUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(InngestBroker) broker: Broker,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterProductUseCase(database, broker, datetimeProvider)
  }

  @Post()
  @RequiredProfiles([UserProfile.Manager])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product registered.',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The product registration body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The product registration is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot register products.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The product name conflicts with an existing product.',
    type: ErrorResponseDto,
  })
  handle(
    @Body(new ZodValidationPipe(registerProductSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, ...body })
  }
}
