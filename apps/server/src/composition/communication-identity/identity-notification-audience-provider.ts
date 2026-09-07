import type { NotificationAudienceProvider } from '@scoops/core/communication/interfaces'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'

@Injectable()
export class IdentityNotificationAudienceProvider
  implements NotificationAudienceProvider
{
  constructor(
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
  ) {}

  async findManyActiveByEstablishment(establishmentId: string) {
    const users =
      await this.usersRepository.findManyActiveByEstablishment(establishmentId)
    return users.map(({ id, profile }) => ({ userId: id, profile }))
  }
}
