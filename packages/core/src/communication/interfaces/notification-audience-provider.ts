import type { NotificationAudienceMember } from '#communication/domain/structures/notification-audience-member.ts'

export interface NotificationAudienceProvider {
  findManyActiveByEstablishment(
    establishmentId: string,
  ): Promise<readonly NotificationAudienceMember[]>
}
