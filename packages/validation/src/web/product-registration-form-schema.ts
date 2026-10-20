import {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

import { accompanimentPriceSchema } from '../mrp/accompaniment-price-schema.ts'
import { registerProductSizeSchema } from '../mrp/register-product-size-schema.ts'
import { resalePriceSchema } from '../mrp/resale-price-schema.ts'

const SALE_PRICE_PATTERN = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/
const SIZE_QUANTITY_PATTERN = /^(?:\d+|\d*\.\d{1,3})$/
const SIZE_PRICE_PATTERN = SALE_PRICE_PATTERN
const SIZE_MESSAGES = {
  name: 'Informe o nome do tamanho.',
  quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
  price: 'Informe um preço válido, com até duas casas decimais.',
  duplicate: 'Já existe um tamanho com esse nome.',
} as const
const SALE_PRICE_FIELDS = [
  {
    category: ProductCategory.Resale,
    field: 'resalePrice',
    message:
      'Informe um preço de revenda maior ou igual a zero, com até duas casas decimais.',
    priceSchema: resalePriceSchema,
  },
  {
    category: ProductCategory.Accompaniment,
    field: 'accompanimentPrice',
    message: 'Informe um preço maior ou igual a zero, com até duas casas decimais.',
    priceSchema: accompanimentPriceSchema,
  },
] as const

type SizeFormRow = { id: string; name: string; quantity: string; price: string }

type SalePriceFormValues = {
  categories: ProductCategory[]
  stockControl: ProductStockControl
  resalePrice: string
  accompanimentPrice: string
}

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
    resalePrice: z.string(),
    accompanimentPrice: z.string(),
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
    sizes: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.string(),
        price: z.string(),
      }),
    ),
  })
  .superRefine((values, context) => {
    validateSalePrices(values, context)
    validateSizes(values, context)

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

// A sale price is validated only while its field is visible (FR-01); a hidden field keeps
// its typed value but can neither block submit nor be sent.
function isSalePriceVisible(
  { categories, stockControl }: SalePriceFormValues,
  category: ProductCategory,
): boolean {
  const isSingleStock =
    stockControl === ProductStockControl.Single ||
    categories.includes(ProductCategory.Manufacturable)

  return (
    isSingleStock &&
    categories.includes(category) &&
    !categories.includes(ProductCategory.Portion)
  )
}

function validateSalePrices(values: SalePriceFormValues, context: z.RefinementCtx): void {
  for (const { category, field, message, priceSchema } of SALE_PRICE_FIELDS) {
    const price = values[field].trim().replace(',', '.')
    const isChecked = price !== '' && isSalePriceVisible(values, category)

    if (isChecked && !isValidSalePrice(price, priceSchema)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message })
    }
  }
}

function isValidSalePrice(price: string, priceSchema: z.ZodType<number>): boolean {
  return SALE_PRICE_PATTERN.test(price) && priceSchema.safeParse(Number(price)).success
}

// Size rows are validated only while Porção is selected (FR-12); a completely empty row is
// ignored and a duplicate name is reported on the later row.
function validateSizes(
  values: { categories: ProductCategory[]; sizes: SizeFormRow[] },
  context: z.RefinementCtx,
): void {
  if (!values.categories.includes(ProductCategory.Portion)) return

  const seenNames = new Set<string>()
  values.sizes.forEach((size, index) => {
    if (isEmptySizeRow(size)) return

    for (const field of getInvalidSizeFields(size)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sizes', index, field],
        message: SIZE_MESSAGES[field],
      })
    }

    const name = size.name.trim().toLocaleLowerCase()
    if (name === '') return
    if (seenNames.has(name)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sizes', index, 'name'],
        message: SIZE_MESSAGES.duplicate,
      })
    }
    seenNames.add(name)
  })
}

function isEmptySizeRow({ name, quantity, price }: SizeFormRow): boolean {
  return [name, quantity, price].every((value) => value.trim() === '')
}

function getInvalidSizeFields(size: SizeFormRow): Array<'name' | 'quantity' | 'price'> {
  const quantity = size.quantity.trim().replace(',', '.')
  const price = size.price.trim().replace(',', '.')
  const nameSchema = registerProductSizeSchema.shape.name
  const checks = [
    ['name', nameSchema.safeParse(size.name).success],
    [
      'quantity',
      SIZE_QUANTITY_PATTERN.test(quantity) &&
        registerProductSizeSchema.shape.quantity.safeParse(Number(quantity)).success,
    ],
    [
      'price',
      SIZE_PRICE_PATTERN.test(price) &&
        registerProductSizeSchema.shape.price.safeParse(Number(price)).success,
    ],
  ] as const

  return checks.filter(([, isValid]) => !isValid).map(([field]) => field)
}
