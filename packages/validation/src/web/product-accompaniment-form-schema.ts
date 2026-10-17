import { z } from 'zod'

import { accompanimentPriceSchema } from '../mrp/accompaniment-price-schema.ts'

const positiveQuantitySchema = z
  .string()
  .refine(
    (value) =>
      isValidScaleNumber(value, /^(?:\d+|\d*\.\d{1,3})$/, (quantity) => quantity > 0),
    'Informe uma quantidade maior que zero, com até três casas decimais.',
  )

export const productAccompanimentFormSchema = z
  .object({
    accompanimentProductId: z.string().trim().min(1, 'Selecione um acompanhamento.'),
    accompanimentTypeId: z.string().trim().min(1, 'Selecione um tipo.'),
    quantityPerPortion: positiveQuantitySchema,
    accompanimentPrice: z
      .string()
      .trim()
      .refine(
        (value) =>
          isValidScaleNumber(
            value,
            /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/,
            (price) => accompanimentPriceSchema.safeParse(price).success,
          ),
        'Informe um preço maior ou igual a zero, com até duas casas decimais.',
      ),
    isGlobal: z.boolean(),
  })
  .strict()

function isValidScaleNumber(
  value: string,
  pattern: RegExp,
  predicate: (value: number) => boolean,
): boolean {
  const normalizedValue = value.trim().replace(',', '.')
  const number = Number(normalizedValue)
  return pattern.test(normalizedValue) && Number.isFinite(number) && predicate(number)
}
