import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const AccompanimentTypesController = () =>
  applyDecorators(Controller('accompaniment-types'), ApiTags('MRP Accompaniment Types'))
