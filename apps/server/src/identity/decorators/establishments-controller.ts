import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const EstablishmentsController = () =>
  applyDecorators(Controller('establishments'), ApiTags('Establishment'))
