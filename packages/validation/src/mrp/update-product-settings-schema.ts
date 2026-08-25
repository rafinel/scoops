import { ProductStatus } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const updateProductSettingsSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120).optional(),
    idealStock: z
      .number()
      .finite()
      .nonnegative()
      .refine(hasAtMostThreeDecimalPlaces)
      .nullable()
      .optional(),
    status: z.enum(ProductStatus).optional(),
    allowNegativeStock: z.boolean().optional(),
    internalNotes: z
      .string()
      .trim()
      .max(2000)
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    expectedUpdatedAt: z.iso.datetime().transform((value) => new Date(value)),
  })
  .refine(
    ({ expectedUpdatedAt: _expectedUpdatedAt, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined),
    {
      message: 'Informe pelo menos uma configuração para alterar.',
    },
  )

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}
