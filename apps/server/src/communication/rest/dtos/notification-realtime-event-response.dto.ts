import { ApiProperty } from '@nestjs/swagger'
import type { Notification } from '@scoops/core/communication/domain/entities'

import { NotificationResponseDto } from './notification-response.dto'

export class NotificationRealtimeEventResponseDto {
  @ApiProperty({ enum: [1] }) version!: 1
  @ApiProperty({ type: () => NotificationResponseDto })
  notification!: NotificationResponseDto

  static from(notification: Notification): NotificationRealtimeEventResponseDto {
    return Object.assign(new NotificationRealtimeEventResponseDto(), {
      version: 1 as const,
      notification: NotificationResponseDto.from(notification),
    })
  }
}
