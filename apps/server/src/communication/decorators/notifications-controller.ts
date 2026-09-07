import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const NotificationsController = () =>
  applyDecorators(Controller('notifications'), ApiTags('Notification'))
