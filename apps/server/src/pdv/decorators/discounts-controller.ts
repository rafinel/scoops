import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const DiscountsController = () =>
  applyDecorators(Controller('discounts'), ApiTags('PDV Discounts'))
