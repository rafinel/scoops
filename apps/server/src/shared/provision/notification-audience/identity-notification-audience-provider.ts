import type { NotificationAudienceProvider } from '@scoops/core/communication/interfaces'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class IdentityNotificationAudienceProvider
  implements NotificationAudienceProvider
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async findManyActiveByEstablishment(establishmentId: string) {
    const users =
      await this.usersRepository.findManyActiveByEstablishment(establishmentId)
    return users.map(({ id, profile }) => ({ userId: id, profile }))
  }
}
