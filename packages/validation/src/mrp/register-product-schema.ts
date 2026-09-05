import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

import { productCategorySchema } from './product-category-schema.ts'
import { productRegistrationBrandSchema } from './product-registration-brand-schema.ts'
import { productStockControlSchema } from './product-stock-control-schema.ts'
import { productUnitSchema } from './product-unit-schema.ts'

export const registerProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unit: productUnitSchema,
    categories: z.array(productCategorySchema).min(1),
    stockControl: productStockControlSchema,
    allowNegativeStock: z.boolean().default(false),
    idealStock: z.number().min(0),
    currentUnitCost: z
      .number()
      .finite()
      .nonnegative()
      .refine(hasAtMostSixDecimalPlaces)
      .optional(),
    initialStock: z.number().finite().optional(),
    brands: z.array(productRegistrationBrandSchema).optional(),
  })
  .superRefine((input, context) => {
    if (
      !input.allowNegativeStock &&
      input.initialStock !== undefined &&
      input.initialStock < 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['initialStock'],
        message: 'Initial stock cannot be negative unless negative stock is enabled.',
      })
    }

    if (!input.allowNegativeStock) {
      for (const [index, brand] of (input.brands ?? []).entries()) {
        if (brand.initialQuantity < 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['brands', index, 'initialQuantity'],
            message: 'Initial stock cannot be negative unless negative stock is enabled.',
          })
        }
      }
    }

    if (input.stockControl === ProductStockControl.Single && input.brands !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['brands'],
        message: 'Produtos com estoque único não podem possuir marcas.',
      })
    }

    if (input.stockControl === ProductStockControl.ByBrand) {
      if (!input.brands?.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brands'],
          message: 'Produtos por marca devem possuir pelo menos uma marca.',
        })
      } else if (input.brands.filter((brand) => brand.isPrimary).length !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brands'],
          message: 'Produtos por marca devem possuir exatamente uma marca principal.',
        })
      }
    }
  })
  .strict()

function hasAtMostSixDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-8
}
