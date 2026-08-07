import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const UsersController = () => applyDecorators(Controller('users'), ApiTags('User'))
