import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const RegistrationAttemptsController = () =>
  applyDecorators(Controller('registration-attempts'), ApiTags('Registration Attempt'))
