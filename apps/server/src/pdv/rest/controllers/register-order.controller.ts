import { Body, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { OrderPreviewTokenService, PdvDatabase } from '@scoops/core/pdv/interfaces'
import { RegisterOrderUseCase } from '@scoops/core/pdv/use-cases'
import { registerOrderSchema } from '@scoops/validation'
import type { Response } from 'express'

import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { OrdersController } from '@/pdv/decorators'
import {
  CorrectionRequiredOrderResponseDto,
  OrderRegistrationResponseDto,
  RegisteredOrderResponseDto,
  RepricedOrderResponseDto,
  ReviewRequiredOrderResponseDto,
} from '@/pdv/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from '@/shared/rest/pipes'

type RequestBody = Omit<Parameters<RegisterOrderUseCase['execute']>[0], 'actor'>

@OrdersController()
@ApiExtraModels(
  OrderRegistrationResponseDto,
  RegisteredOrderResponseDto,
  RepricedOrderResponseDto,
  ReviewRequiredOrderResponseDto,
  CorrectionRequiredOrderResponseDto,
  ErrorResponseDto,
)
export class RegisterOrderController {
  private readonly useCase: RegisterOrderUseCase

  constructor(
    @Inject(PDV_REPOSITORIES.database) database: PdvDatabase,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(PDV_PROVIDERS.previewToken) tokenService: OrderPreviewTokenService,
  ) {
    this.useCase = new RegisterOrderUseCase(database, datetimeProvider, tokenService)
  }

  @Post()
  @RequiredProfiles([UserProfile.Manager, UserProfile.Operator])
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order registered.',
    schema: { $ref: getSchemaPath(RegisteredOrderResponseDto) },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order replayed or repriced.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(RegisteredOrderResponseDto) },
        { $ref: getSchemaPath(RepricedOrderResponseDto) },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'The order requires review or correction, or the idempotency key conflicts with another order.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ErrorResponseDto) },
        { $ref: getSchemaPath(ReviewRequiredOrderResponseDto) },
        { $ref: getSchemaPath(CorrectionRequiredOrderResponseDto) },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The preview token is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The registration body is malformed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The selected sales channel was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The authenticated profile cannot register orders.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'The registration was rolled back after an unexpected failure.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The registration was rolled back because a dependency is unavailable.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(registerOrderSchema)) body: RequestBody,
    @CurrentAccount() actor: Account,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OrderRegistrationResponseDto> {
    const result = await this.useCase.execute({ actor, ...body })
    response.status(
      this.getStatus(
        result.kind,
        result.kind === 'registered' ? result.replayed : undefined,
      ),
    )
    return OrderRegistrationResponseDto.from(result)
  }

  private getStatus(kind: OrderRegistrationResponseDto['kind'], replayed?: boolean) {
    if (kind === 'registered') return replayed ? HttpStatus.OK : HttpStatus.CREATED
    if (kind === 'repriced') return HttpStatus.OK
    return HttpStatus.CONFLICT
  }
}
