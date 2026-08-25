import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

import { productCategorySchema } from './product-category-schema.ts'

export const changeProductCategoriesSchema = z.strictObject({
  categories: z
    .array(productCategorySchema)
    .min(1)
    .refine((categories) => new Set(categories).size === categories.length, {
      message: 'As categorias não podem se repetir.',
    })
    .refine(
      (categories) =>
        !(
          categories.includes(ProductCategory.Portion) &&
          categories.includes(ProductCategory.Resale)
        ),
      {
        message: 'Porção e Revenda não podem ser selecionadas juntas.',
      },
    ),
  expectedUpdatedAt: z.iso.datetime().transform((value) => new Date(value)),
})
