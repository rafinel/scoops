import type { NotificationCreate } from '@scoops/core/communication/domain/structures'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'

export type CommunicationSeed = {
  notifications?: NotificationCreate[]
}

@Injectable()
export class CommunicationSeeder {
  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.notifications)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async clear(): Promise<void> {
    await this.notificationsRepository.removeAll()
  }

  async run(seed: CommunicationSeed = {}): Promise<void> {
    await this.notificationsRepository.addMany(seed.notifications ?? [])
  }
}
