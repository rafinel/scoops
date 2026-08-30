import { OrderStatus } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

const optionalSearchSchema = z
  .string()
  .trim()
  .max(100)
  .transform((value) => (value === '' ? undefined : value))
  .optional()

const optionalInstantSchema = z.iso
  .datetime()
  .transform((value) => new Date(value))
  .optional()

const channelIdSchema = z.union([z.uuid(), z.literal('none')]).transform((value) => {
  return value === 'none' ? null : value
})

export const orderListQuerySchema = z
  .strictObject({
    search: optionalSearchSchema,
    createdFrom: optionalInstantSchema,
    createdTo: optionalInstantSchema,
    channelId: channelIdSchema.optional(),
    status: z.enum(OrderStatus).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(6),
  })
  .superRefine(({ createdFrom, createdTo }, context) => {
    if (createdFrom && !createdTo) {
      context.addIssue({
        code: 'custom',
        message: 'Informe o intervalo completo.',
        path: ['createdTo'],
      })
      return
    }

    if (!createdFrom && createdTo) {
      context.addIssue({
        code: 'custom',
        message: 'Informe o intervalo completo.',
        path: ['createdFrom'],
      })
      return
    }

    if (createdFrom && createdTo && createdFrom > createdTo) {
      context.addIssue({
        code: 'custom',
        message: 'A data final deve ser igual ou posterior à data inicial.',
        path: ['createdTo'],
      })
    }
  })

export type OrderListQuery = z.infer<typeof orderListQuerySchema>
