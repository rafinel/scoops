import type { SalesChannel, SalesChannelCreate } from '@scoops/core/pdv/domain/entities'
import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { ComboCreate } from '@scoops/core/pdv/domain/structures'
import type {
  DiscountsRepository,
  SalesChannelsRepository,
} from '@scoops/core/pdv/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { PDV_REPOSITORIES } from '@/pdv/constants'

type SalesChannelsSeedRepository = SalesChannelsRepository & {
  addMany(inputs: SalesChannelCreate[]): Promise<readonly SalesChannel[]>
}

type DiscountsSeedRepository = DiscountsRepository & {
  addMany(inputs: ComboCreate[]): Promise<readonly Combo[]>
  removeAll(): Promise<void>
}

export type PdvSeed = {
  salesChannels?: SalesChannelCreate[]
  combos?: ComboCreate[]
}

@Injectable()
export class PdvSeeder {
  constructor(
    @Inject(PDV_REPOSITORIES.discounts)
    private readonly discountsRepository: DiscountsSeedRepository,
    @Inject(PDV_REPOSITORIES.salesChannels)
    private readonly salesChannelsRepository: SalesChannelsSeedRepository,
  ) {}

  async clear(): Promise<void> {
    await this.discountsRepository.removeAll()
    await this.salesChannelsRepository.removeAll()
  }

  async run(seed: PdvSeed = {}): Promise<void> {
    if (seed.salesChannels?.length) {
      await this.salesChannelsRepository.addMany(seed.salesChannels)
    }
    if (seed.combos?.length) {
      await this.discountsRepository.addMany(seed.combos)
    }
  }
}
