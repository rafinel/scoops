import type {
  NotificationCreate,
  NotificationListParams,
  NotificationPage,
} from '@scoops/core/communication/domain/structures'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import { and, count, desc, eq, gte, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleNotificationMapper } from '@/communication/database/drizzle/mappers/drizzle-notification-mapper'
import { notificationModel } from '@/communication/database/drizzle/models/notification-model'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleNotificationsRepository
  extends DrizzleRepository
  implements NotificationsRepository
{
  async addMany(inputs: readonly NotificationCreate[]): Promise<void> {
    if (inputs.length === 0) return

    await this.database
      .insert(notificationModel)
      .values([...inputs])
      .onConflictDoNothing({
        target: [
          notificationModel.sourceEventId,
          notificationModel.recipientUserId,
          notificationModel.kind,
        ],
      })
  }

  async findPage(input: NotificationListParams): Promise<NotificationPage> {
    const scopeFilters = [
      eq(notificationModel.establishmentId, input.establishmentId),
      eq(notificationModel.recipientUserId, input.recipientUserId),
    ]
    const pageFilters = [...scopeFilters]

    if (input.occurredFrom) {
      pageFilters.push(gte(notificationModel.occurredAt, input.occurredFrom))
    }
    if (input.occurredTo) {
      pageFilters.push(lte(notificationModel.occurredAt, input.occurredTo))
    }
    if (input.cursor) {
      const cursorFilter = or(
        lt(notificationModel.occurredAt, input.cursor.occurredAt),
        and(
          eq(notificationModel.occurredAt, input.cursor.occurredAt),
          lt(notificationModel.id, input.cursor.id),
        ),
      )
      if (cursorFilter) pageFilters.push(cursorFilter)
    }

    const [records, unreadRows] = await Promise.all([
      this.database
        .select()
        .from(notificationModel)
        .where(and(...pageFilters))
        .orderBy(desc(notificationModel.occurredAt), desc(notificationModel.id))
        .limit(input.limit + 1),
      this.database
        .select({ count: count() })
        .from(notificationModel)
        .where(and(...scopeFilters, isNull(notificationModel.readAt))),
    ])

    const hasNextPage = records.length > input.limit
    const pageRecords = hasNextPage ? records.slice(0, input.limit) : records
    const items = pageRecords.map(DrizzleNotificationMapper.toDomain)
    const lastItem = items.at(-1)

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? { occurredAt: lastItem.occurredAt, id: lastItem.id }
          : undefined,
      unreadCount: Number(unreadRows[0]?.count ?? 0),
    }
  }

  async markRead(input: {
    establishmentId: string
    recipientUserId: string
    notificationIds: readonly string[]
    readAt: Date
  }): Promise<readonly string[]> {
    if (input.notificationIds.length === 0) return []

    const records = await this.database
      .update(notificationModel)
      .set({
        readAt: sql`coalesce(${notificationModel.readAt}, ${input.readAt.toISOString()}::timestamptz)`,
      })
      .where(
        and(
          eq(notificationModel.establishmentId, input.establishmentId),
          eq(notificationModel.recipientUserId, input.recipientUserId),
          inArray(notificationModel.id, input.notificationIds),
        ),
      )
      .returning({ id: notificationModel.id })

    return records.map(({ id }) => id)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(notificationModel)
  }
}
