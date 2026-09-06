import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Notification } from '@scoops/core/communication/domain/entities'
import type {
  NotificationCursor,
  NotificationPage,
} from '@scoops/core/communication/domain/structures'
import { NotificationKind } from '@scoops/core/communication/domain/structures'

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() sourceEventId!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) recipientUserId!: string
  @ApiProperty({ enum: Object.values(NotificationKind) }) kind!: NotificationKind
  @ApiProperty() title!: string
  @ApiProperty() message!: string
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiPropertyOptional({ format: 'date-time' }) readAt?: Date

  static from(notification: Notification): NotificationResponseDto {
    return Object.assign(new NotificationResponseDto(), {
      id: notification.id,
      sourceEventId: notification.sourceEventId,
      establishmentId: notification.establishmentId,
      recipientUserId: notification.recipientUserId,
      kind: notification.kind,
      title: notification.title,
      message: notification.message,
      occurredAt: notification.occurredAt,
      createdAt: notification.createdAt,
      ...(notification.readAt === undefined ? {} : { readAt: notification.readAt }),
    })
  }
}

export class NotificationCursorResponseDto {
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
  @ApiProperty({ format: 'uuid' }) id!: string

  static from(cursor: NotificationCursor): NotificationCursorResponseDto {
    return Object.assign(new NotificationCursorResponseDto(), cursor)
  }
}

export class NotificationPageResponseDto {
  @ApiProperty({ type: () => NotificationResponseDto, isArray: true })
  items!: NotificationResponseDto[]
  @ApiPropertyOptional({ type: () => NotificationCursorResponseDto })
  nextCursor?: NotificationCursorResponseDto
  @ApiProperty() unreadCount!: number

  static from(page: NotificationPage): NotificationPageResponseDto {
    return Object.assign(new NotificationPageResponseDto(), {
      items: page.items.map(NotificationResponseDto.from),
      ...(page.nextCursor === undefined
        ? {}
        : { nextCursor: NotificationCursorResponseDto.from(page.nextCursor) }),
      unreadCount: page.unreadCount,
    })
  }
}

export class NotificationReadResponseDto {
  @ApiProperty({ format: 'uuid', isArray: true }) notificationIds!: string[]

  static from(notificationIds: readonly string[]): NotificationReadResponseDto {
    return Object.assign(new NotificationReadResponseDto(), {
      notificationIds: [...notificationIds],
    })
  }
}
