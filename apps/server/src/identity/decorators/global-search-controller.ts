import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const GlobalSearchController = () =>
  applyDecorators(Controller('global-search'), ApiTags('Identity Global Search'))
