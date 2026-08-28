import { SaleItemKind } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

const quantitySchema = z.number().finite().int().min(1).max(999)

const orderLineSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    productId: z.uuid(),
    kind: z.literal(SaleItemKind.Portion),
    quantity: quantitySchema,
    sizeId: z.uuid(),
    accompanimentIds: z.array(z.uuid()),
  }),
  z.strictObject({
    productId: z.uuid(),
    kind: z.literal(SaleItemKind.Resale),
    quantity: quantitySchema,
    brandId: z.uuid().optional(),
  }),
])

export const registerOrderSchema = z.strictObject({
  idempotencyKey: z.uuid(),
  previewToken: z.string().min(1),
  channelId: z.uuid().optional(),
  lines: z.array(orderLineSchema).min(1).max(50),
})
