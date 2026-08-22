import {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productRegistrationFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do produto.'),
    unit: z.enum(ProductUnit),
    categories: z
      .array(z.enum(ProductCategory))
      .min(1, 'Selecione pelo menos uma categoria.'),
    stockControl: z.enum(ProductStockControl),
    allowNegativeStock: z.boolean(),
    currentUnitCost: z
      .string()
      .refine(
        (value) =>
          value.trim() === '' || (Number.isFinite(Number(value)) && Number(value) >= 0),
        'Informe um custo unitário válido.',
      ),
    initialStock: z
      .string()
      .refine(
        (value) =>
          value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
        'Informe um estoque inicial válido.',
      ),
    idealStock: z
      .string()
      .refine(
        (value) =>
          value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
        'Informe um estoque ideal válido.',
      ),
    brands: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        packageQuantity: z.string(),
        packagePrice: z.string(),
        packageCount: z.string(),
        isPrimary: z.boolean(),
      }),
    ),
  })
  .refine(
    ({ categories }) =>
      !(
        categories.includes(ProductCategory.Portion) &&
        categories.includes(ProductCategory.Resale)
      ),
    {
      message: 'Porção e Revenda não podem ser selecionadas juntas.',
      path: ['categories'],
    },
  )
