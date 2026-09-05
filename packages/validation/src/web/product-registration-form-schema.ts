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
        (value) => value.trim() !== '' && Number.isFinite(Number(value)),
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
        unit: z.enum(ProductUnit).optional(),
        packageQuantity: z.string(),
        packagePrice: z.string(),
        packageCount: z.string(),
        isPrimary: z.boolean(),
      }),
    ),
  })
  .superRefine((values, context) => {
    if (values.stockControl === ProductStockControl.ByBrand) {
      if (values.brands.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brands'],
          message: 'Adicione pelo menos uma marca.',
        })
      } else if (values.brands.filter((brand) => brand.isPrimary).length !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brands'],
          message: 'Selecione exatamente uma marca principal.',
        })
      }
    }

    if (!values.allowNegativeStock && Number(values.initialStock) < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['initialStock'],
        message: 'Informe um estoque inicial válido.',
      })
    }

    if (values.stockControl === ProductStockControl.ByBrand) {
      values.brands.forEach((brand, index) => {
        const packageQuantity = parseLocalizedNumber(brand.packageQuantity)
        const packagePrice = parseLocalizedNumber(brand.packagePrice)
        const packageCount = parseLocalizedNumber(brand.packageCount)

        if (!brand.name.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['brands', index, 'name'],
            message: 'Informe o nome da marca.',
          })
        }
        if (!Number.isFinite(packageQuantity) || packageQuantity <= 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['brands', index, 'packageQuantity'],
            message: 'Informe uma quantidade por embalagem válida.',
          })
        }
        if (!Number.isFinite(packagePrice) || packagePrice < 0) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['brands', index, 'packagePrice'],
            message: 'Informe um valor por embalagem válido.',
          })
        }
        if (
          !Number.isFinite(packageCount) ||
          (!values.allowNegativeStock && packageCount < 0)
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['brands', index, 'packageCount'],
            message: 'Informe uma quantidade inicial válida.',
          })
        }
      })
    }
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

function parseLocalizedNumber(value: string): number {
  return Number(value.replace(',', '.'))
}
