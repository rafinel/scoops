import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { NotificationPage } from '@scoops/core/communication/domain/structures'

import { NotificationCursorResponseDto } from './notification-cursor-response.dto'
import { NotificationResponseDto } from './notification-response.dto'

export class NotificationPageResponseDto {
  @ApiProperty({ type: () => NotificationResponseDto, isArray: true })
  items!: NotificationResponseDto[]
  @ApiPropertyOptional({ type: () => NotificationCursorResponseDto })
  nextCursor?: NotificationCursorResponseDto
  @ApiProperty() unreadCount!: number

  static from(page: NotificationPage): NotificationPageResponseDto {
    return Object.assign(new NotificationPageResponseDto(), {
      items: page.items.map(NotificationResponseDto.from),
      unreadCount: page.unreadCount,
      ...notificationPageCursor(page.nextCursor),
    })
  }
}

function notificationPageCursor(cursor: NotificationPage['nextCursor']) {
  return cursor ? { nextCursor: NotificationCursorResponseDto.from(cursor) } : {}
}
