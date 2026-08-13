import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const AuthController = () =>
  applyDecorators(Controller('auth'), ApiTags('Authentication'))
