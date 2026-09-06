import type { NotificationListParams } from '#communication/domain/structures/notification-list-params.ts'
import type { NotificationPage } from '#communication/domain/structures/notification-page.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface CommunicationService {
  listNotifications(
    input: Omit<NotificationListParams, 'establishmentId' | 'recipientUserId'>,
  ): Promise<RestResponse<NotificationPage>>
  markNotificationsRead(
    notificationIds: readonly string[],
  ): Promise<RestResponse<readonly string[]>>
}
