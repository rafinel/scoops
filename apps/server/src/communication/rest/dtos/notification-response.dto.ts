import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Notification } from '@scoops/core/communication/domain/entities'
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
