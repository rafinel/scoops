import type {
  NotificationListParams,
  NotificationPage,
} from '@scoops/core/communication/domain/structures'
import type { CommunicationService as CommunicationRestService } from '@scoops/core/communication/interfaces'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'

import {
  NotificationPageMapper,
  type NotificationPageJson,
} from '@/rest/mappers/communication'

type NotificationReadResponseJson = {
  notificationIds: readonly string[]
}

export const createCommunicationService = (
  restClient: RestClient,
): CommunicationRestService => ({
  async listNotifications(
    input: Omit<NotificationListParams, 'establishmentId' | 'recipientUserId'>,
  ) {
    const params = new URLSearchParams({ limit: String(input.limit) })

    if (input.occurredFrom) params.set('occurredFrom', input.occurredFrom.toISOString())
    if (input.occurredTo) params.set('occurredTo', input.occurredTo.toISOString())
    if (input.cursor) {
      params.set('cursorOccurredAt', input.cursor.occurredAt.toISOString())
      params.set('cursorId', input.cursor.id)
    }

    const response = await restClient.get<NotificationPageJson>(
      `/notifications?${params.toString()}`,
    )

    if (!response.isSuccessful) {
      return response as unknown as RestResponse<NotificationPage>
    }

    return new RestResponse({
      body: NotificationPageMapper(response.body),
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },

  async markNotificationsRead(notificationIds) {
    const response = await restClient.patch<NotificationReadResponseJson>(
      '/notifications/read',
      { notificationIds },
    )

    if (!response.isSuccessful) {
      return response as unknown as RestResponse<readonly string[]>
    }

    return new RestResponse({
      body: response.body.notificationIds,
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },
})
