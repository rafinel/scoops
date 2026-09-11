import { ApiProperty } from '@nestjs/swagger'
import type { NotificationCursor } from '@scoops/core/communication/domain/structures'

export class NotificationCursorResponseDto {
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
  @ApiProperty({ format: 'uuid' }) id!: string

  static from(cursor: NotificationCursor): NotificationCursorResponseDto {
    return Object.assign(new NotificationCursorResponseDto(), cursor)
  }
}
