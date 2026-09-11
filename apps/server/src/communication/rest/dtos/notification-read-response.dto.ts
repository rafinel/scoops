import { ApiProperty } from '@nestjs/swagger'

export class NotificationReadResponseDto {
  @ApiProperty({ format: 'uuid', isArray: true }) notificationIds!: string[]

  static from(notificationIds: readonly string[]): NotificationReadResponseDto {
    return Object.assign(new NotificationReadResponseDto(), {
      notificationIds: [...notificationIds],
    })
  }
}
