import type { UseFormRegister } from 'react-hook-form'

import { Label } from '@/ui/shadcn/label'

import { AffixedInput } from '../../../affixed-input'

import type { ProductRegistrationFormValues } from '../../../use-product-registration-page'

const SALE_PRICE_FIELD_CLASS = 'grid min-w-0 content-start gap-1.5'
const SALE_PRICE_LABEL_CLASS = 'text-xs font-semibold text-muted-foreground'
const SALE_PRICE_INPUT_PROPS = {
  inputMode: 'decimal',
  placeholder: '0,00',
  type: 'text',
} as const
const SALE_PRICE_HINT_CLASS = 'text-xs font-normal text-muted-foreground'
const SALE_PRICE_ERROR_CLASS = 'text-sm text-destructive'
const SALE_PRICE_HINT = 'Opcional. Sem preço, o produto fica indisponível no PDV.'

export type SalePriceFieldProps = {
  error?: string
  idPrefix: string
  label: string
  name: 'accompanimentPrice' | 'resalePrice'
  onChange: (value: string) => void
  register: UseFormRegister<ProductRegistrationFormValues>
  value: string
}

export const SalePriceField = ({
  error,
  idPrefix,
  label,
  name,
  onChange,
  register,
  value,
}: SalePriceFieldProps) => (
  <div className={SALE_PRICE_FIELD_CLASS}>
    <Label className={SALE_PRICE_LABEL_CLASS} htmlFor={`${idPrefix}-input`}>
      {label}
    </Label>
    <AffixedInput
      {...register(name)}
      {...SALE_PRICE_INPUT_PROPS}
      aria-describedby={`${idPrefix}-hint${error ? ` ${idPrefix}-error` : ''}`}
      aria-invalid={Boolean(error)}
      id={`${idPrefix}-input`}
      onChange={(event) => onChange(event.target.value)}
      prefixText='R$'
      value={value}
    />
    <span className={SALE_PRICE_HINT_CLASS} id={`${idPrefix}-hint`}>
      {SALE_PRICE_HINT}
    </span>
    {error ? (
      <span className={SALE_PRICE_ERROR_CLASS} id={`${idPrefix}-error`}>
        {error}
      </span>
    ) : null}
  </div>
)
