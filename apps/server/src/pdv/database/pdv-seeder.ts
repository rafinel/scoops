import type { SalesChannel, SalesChannelCreate } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { PDV_REPOSITORIES } from '@/pdv/constants'

type SalesChannelsSeedRepository = SalesChannelsRepository & {
  addMany(inputs: SalesChannelCreate[]): Promise<readonly SalesChannel[]>
}

export type PdvSeed = {
  salesChannels?: SalesChannelCreate[]
}

@Injectable()
export class PdvSeeder {
  constructor(
    @Inject(PDV_REPOSITORIES.salesChannels)
    private readonly salesChannelsRepository: SalesChannelsSeedRepository,
  ) {}

  async clear(): Promise<void> {
    await this.salesChannelsRepository.removeAll()
  }

  async run(seed: PdvSeed = {}): Promise<void> {
    if (!seed.salesChannels || seed.salesChannels.length === 0) return
    await this.salesChannelsRepository.addMany(seed.salesChannels)
  }
}
