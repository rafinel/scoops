import type { ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { AffixedInput } from '../../affixed-input'
import type { SizeDraft, SizeFieldErrors } from '../../use-product-registration-page'

const ROW_CLASS =
  'relative grid min-w-0 gap-2.5 rounded-xl border border-border/60 p-2.5 sm:grid-cols-[minmax(0,1fr)_12.5rem_12.5rem_auto] sm:gap-2 sm:rounded-none sm:border-0 sm:p-0'
const ROW_TITLE_CLASS = 'text-xs font-extrabold sm:hidden'
const FIELD_CLASS = 'grid min-w-0 content-start gap-1.5'
const LABEL_CLASS = 'text-xs font-semibold text-muted-foreground'
const ERROR_CLASS = 'text-xs text-destructive'
const NAME_INPUT_CLASS = 'h-10 rounded-xl px-3 text-sm'
const REMOVE_BUTTON_CLASS =
  'absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground sm:static sm:mt-[1.375rem] sm:self-start'
const QUANTITY_INPUT_PROPS = {
  inputMode: 'decimal',
  placeholder: '0,00',
  type: 'text',
} as const
const PRICE_INPUT_PROPS = {
  inputMode: 'decimal',
  placeholder: '0,00',
  type: 'text',
} as const

export type ProductSizeRowProps = {
  errors?: SizeFieldErrors
  index: number
  onChange: (sizeId: string, changes: Partial<SizeDraft>) => void
  onRemove: (sizeId: string) => void
  size: SizeDraft
  unit: ProductUnit
}

export const ProductSizeRow = ({
  errors,
  index,
  onChange,
  onRemove,
  size,
  unit,
}: ProductSizeRowProps) => {
  const number = index + 1
  const idPrefix = `product-size-${size.id}`
  const describedBy = (field: keyof SizeFieldErrors) =>
    errors?.[field] ? `${idPrefix}-${field}-error` : undefined

  return (
    <fieldset className={ROW_CLASS}>
      <legend className='sr-only'>Tamanho {number}</legend>
      <span aria-hidden='true' className={ROW_TITLE_CLASS}>
        Tamanho {number}
      </span>
      <SizeField error={errors?.name} id={`${idPrefix}-name`} label='Nome'>
        <Input
          aria-describedby={describedBy('name')}
          aria-invalid={Boolean(errors?.name)}
          aria-label={`Nome do tamanho ${number}`}
          className={NAME_INPUT_CLASS}
          id={`${idPrefix}-name`}
          onChange={(event) => onChange(size.id, { name: event.target.value })}
          placeholder='Ex: Pequeno'
          value={size.name}
        />
      </SizeField>
      <SizeField error={errors?.quantity} id={`${idPrefix}-quantity`} label='Quantidade'>
        <AffixedInput
          {...QUANTITY_INPUT_PROPS}
          aria-describedby={describedBy('quantity')}
          aria-invalid={Boolean(errors?.quantity)}
          aria-label={`Quantidade do tamanho ${number}`}
          id={`${idPrefix}-quantity`}
          onChange={(event) => onChange(size.id, { quantity: event.target.value })}
          suffixText={unit}
          value={size.quantity}
        />
      </SizeField>
      <SizeField error={errors?.price} id={`${idPrefix}-price`} label='Preço'>
        <AffixedInput
          {...PRICE_INPUT_PROPS}
          aria-describedby={describedBy('price')}
          aria-invalid={Boolean(errors?.price)}
          aria-label={`Preço do tamanho ${number}`}
          id={`${idPrefix}-price`}
          onChange={(event) => onChange(size.id, { price: event.target.value })}
          prefixText='R$'
          value={size.price}
        />
      </SizeField>
      <Button
        aria-label={`Remover tamanho ${number}`}
        className={REMOVE_BUTTON_CLASS}
        onClick={() => onRemove(size.id)}
        size='icon-sm'
        type='button'
        variant='outline'
      >
        <Icon className='size-4' name='trash-2' />
      </Button>
    </fieldset>
  )
}

type SizeFieldProps = {
  children: ReactNode
  error?: string
  id: string
  label: string
}

const SizeField = ({ children, error, id, label }: SizeFieldProps) => (
  <div className={FIELD_CLASS}>
    <Label className={LABEL_CLASS} htmlFor={id}>
      {label}
    </Label>
    {children}
    {error ? (
      <span className={ERROR_CLASS} id={`${id}-error`}>
        {error}
      </span>
    ) : null}
  </div>
)
