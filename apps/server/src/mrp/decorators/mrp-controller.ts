import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const MrpController = () =>
  applyDecorators(Controller('products'), ApiTags('MRP Products'))
