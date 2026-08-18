import type { ProductCreate } from '@scoops/core/mrp/domain/entities'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'

@Injectable()
export class MrpSeeder {
  constructor(
    @Inject(MRP_REPOSITORIES.products)
    private readonly productsRepository: ProductsRepository,
  ) {}

  async clear(): Promise<void> {
    await this.productsRepository.removeAll()
  }

  async run(products: ProductCreate[] = []): Promise<void> {
    await this.productsRepository.addMany(products)
  }
}
