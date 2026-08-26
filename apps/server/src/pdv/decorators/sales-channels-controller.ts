import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const SalesChannelsController = () =>
  applyDecorators(Controller('sales-channels'), ApiTags('PDV Sales Channels'))
