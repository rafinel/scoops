import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const AnalyticsController = () =>
  applyDecorators(Controller('analytics'), ApiTags('Analytics'))
