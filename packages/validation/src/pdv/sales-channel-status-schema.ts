import { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

export const salesChannelStatusSchema = z.enum(SalesChannelStatus, {
  error: 'Selecione um status válido.',
})
