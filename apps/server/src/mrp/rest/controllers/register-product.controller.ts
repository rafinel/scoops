import { Body, Inject, Post } from '@nestjs/common'
import { RegisterProductUseCase } from '@scoops/core/mrp/use-cases'
import type { Broker } from '@scoops/core/shared/interfaces'
import type { MrpDatabase } from '@scoops/core/mrp/interfaces'
import type { RegisterProductInput } from '@scoops/core/mrp/domain/structures'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { Account } from '@scoops/core/identity/domain/entities'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ZodValidationPipe } from '@/shared/rest/pipes'

import { registerProductSchema } from '../schemas/product-schemas'

@MrpController()
export class RegisterProductController {
  private readonly useCase: RegisterProductUseCase

  constructor(
    @Inject(MRP_REPOSITORIES.database) database: MrpDatabase,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new RegisterProductUseCase(database, broker)
  }

  @Post()
  @RequiredProfiles([UserProfile.Manager])
  handle(
    @Body(new ZodValidationPipe(registerProductSchema)) body: unknown,
    @CurrentAccount() actor: Account,
  ) {
    return this.useCase.execute({ actor, ...(body as RegisterProductInput) })
  }
}
