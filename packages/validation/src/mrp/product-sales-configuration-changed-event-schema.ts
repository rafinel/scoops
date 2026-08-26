import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

const nonNegativeCurrencySchema = z
  .number()
  .finite()
  .nonnegative()
  .refine(hasAtMostTwoDecimalPlaces)

const accompanimentSchema = z.strictObject({
  accompanimentId: z.uuid(),
  productId: z.uuid(),
  name: z.string(),
  type: z.string(),
  basePrice: nonNegativeCurrencySchema,
  isActive: z.boolean(),
})

const sizeSchema = z.strictObject({
  sizeId: z.uuid(),
  name: z.string(),
  price: nonNegativeCurrencySchema,
  isActive: z.boolean(),
  accompaniments: z.array(accompanimentSchema),
})

const resaleConfigurationSchema = z.strictObject({
  brandId: z.uuid().optional(),
  brandName: z.string().optional(),
  price: nonNegativeCurrencySchema,
  isActive: z.boolean(),
})

const productSalesConfigurationSchema = z.strictObject({
  establishmentId: z.uuid(),
  productId: z.uuid(),
  name: z.string(),
  categories: z.array(z.enum(ProductCategory)),
  status: z.enum(ProductStatus),
  stockControl: z.enum(ProductStockControl),
  sizes: z.array(sizeSchema),
  resaleConfigurations: z.array(resaleConfigurationSchema),
  updatedAt: z.iso.datetime(),
})

export const productSalesConfigurationChangedEventSchema = z.discriminatedUnion('state', [
  z.strictObject({
    establishmentId: z.uuid(),
    productId: z.uuid(),
    state: z.literal('available'),
    configuration: productSalesConfigurationSchema,
  }),
  z.strictObject({
    establishmentId: z.uuid(),
    productId: z.uuid(),
    state: z.literal('deleted'),
    configuration: z.null(),
  }),
])

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
