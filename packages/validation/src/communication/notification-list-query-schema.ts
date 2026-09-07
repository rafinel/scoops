import { z } from 'zod'

const optionalInstantSchema = z.iso
  .datetime()
  .transform((value) => new Date(value))
  .optional()

export const notificationListQuerySchema = z
  .strictObject({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    occurredFrom: optionalInstantSchema,
    occurredTo: optionalInstantSchema,
    cursorOccurredAt: optionalInstantSchema,
    cursorId: z.uuid().optional(),
  })
  .superRefine((value, context) => {
    if ((value.occurredFrom === undefined) !== (value.occurredTo === undefined))
      context.addIssue({
        code: 'custom',
        message: 'Informe o intervalo completo.',
        path: [value.occurredFrom === undefined ? 'occurredFrom' : 'occurredTo'],
      })

    if (
      value.occurredFrom !== undefined &&
      value.occurredTo !== undefined &&
      value.occurredFrom > value.occurredTo
    )
      context.addIssue({
        code: 'custom',
        message: 'A data final deve ser igual ou posterior à inicial.',
        path: ['occurredTo'],
      })

    if ((value.cursorOccurredAt === undefined) !== (value.cursorId === undefined))
      context.addIssue({
        code: 'custom',
        message: 'Informe o cursor completo.',
        path: [value.cursorOccurredAt === undefined ? 'cursorOccurredAt' : 'cursorId'],
      })
  })

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
