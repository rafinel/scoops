import { Get, Inject, Query as QueryParameter } from '@nestjs/common'
import { ListProductsUseCase } from '@scoops/core/mrp/use-cases'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { Account } from '@scoops/core/identity/domain/entities'
import { z } from 'zod'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpController } from '@/mrp/decorators'
import { CurrentAccount, RequiredProfiles } from '@/identity/decorators'
import { ZodValidationPipe } from '@/shared/rest/pipes'

import { listProductsQuerySchema } from '../schemas/product-schemas'

type QueryInput = z.infer<typeof listProductsQuerySchema>

@MrpController()
export class ListProductsController {
  private readonly useCase: ListProductsUseCase

  constructor(@Inject(MRP_REPOSITORIES.products) productsRepository: ProductsRepository) {
    this.useCase = new ListProductsUseCase(productsRepository)
  }

  @Get()
  @RequiredProfiles([UserProfile.Manager])
  handle(
    @QueryParameter(new ZodValidationPipe(listProductsQuerySchema)) query: QueryInput,
    @CurrentAccount() actor: Account,
  ) {
    const categories = query.category
      ? Array.isArray(query.category)
        ? query.category
        : [query.category]
      : undefined
    return this.useCase.execute({ actor, ...query, categories })
  }
}
