import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const OrdersController = () =>
  applyDecorators(Controller('orders'), ApiTags('Order'))
