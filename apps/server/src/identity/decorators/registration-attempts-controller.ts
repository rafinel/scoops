import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { PublicRoute } from '@/shared/rest/decorators/public-route'

export const RegistrationAttemptsController = () =>
  applyDecorators(
    Controller('registration-attempts'),
    ApiTags('Registration Attempt'),
    PublicRoute(),
  )
