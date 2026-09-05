import type { ProductCategory, ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { FormEvent, ReactNode } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import { Card, CardContent } from '@/ui/shadcn/card'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { cn } from '@/ui/shared/lib/utils'

import type {
  ProductRegistrationFieldErrors,
  ProductRegistrationFormValues,
} from '../use-product-registration-page'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}
const CATEGORY_VALUES: ProductCategory[] = [
  'ingredient',
  'manufacturable',
  'portion',
  'resale',
  'accompaniment',
]
const CATEGORY_STYLES: Record<ProductCategory, { checkbox: string; selected: string }> = {
  ingredient: {
    checkbox: 'data-checked:border-blue-700 data-checked:bg-blue-700',
    selected: 'border-blue-300 bg-blue-50 text-blue-700',
  },
  manufacturable: {
    checkbox: 'data-checked:border-violet-700 data-checked:bg-violet-700',
    selected: 'border-violet-300 bg-violet-50 text-violet-700',
  },
  portion: {
    checkbox: 'data-checked:border-green-700 data-checked:bg-green-700',
    selected: 'border-green-300 bg-green-50 text-green-700',
  },
  accompaniment: {
    checkbox: 'data-checked:border-amber-700 data-checked:bg-amber-700',
    selected: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  resale: {
    checkbox: 'data-checked:border-red-700 data-checked:bg-red-700',
    selected: 'border-red-300 bg-red-50 text-red-700',
  },
}
const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'un', label: 'Unidades (un)' },
]

export type ProductRegistrationFormProps = {
  categories: ProductCategory[]
  children: ReactNode
  fieldErrors: ProductRegistrationFieldErrors
  isCategoryDisabled: (category: ProductCategory) => boolean
  name: string
  onCategoryToggle: (category: ProductCategory) => void
  onNameChange: (value: string) => void
  onUnitChange: (value: ProductUnit) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  register: UseFormRegister<ProductRegistrationFormValues>
  unit: ProductUnit
}

export const ProductRegistrationForm = ({
  categories,
  children,
  fieldErrors,
  isCategoryDisabled,
  name,
  onCategoryToggle,
  onNameChange,
  onSubmit,
  onUnitChange,
  register,
  unit,
}: ProductRegistrationFormProps) => (
  <form className='space-y-4' noValidate onSubmit={onSubmit}>
    <Card className='py-0'>
      <CardContent className='grid gap-4 p-3.5'>
        <div className='grid grid-cols-2 gap-3'>
          <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
            Nome
            <Input
              {...register('name')}
              aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              className='h-10 rounded-xl px-3 text-sm'
              onChange={(event) => onNameChange(event.target.value)}
              placeholder='Ex: Polpa de Açaí'
              value={name}
            />
            {fieldErrors.name ? (
              <span className='text-sm text-destructive' id='product-name-error'>
                {fieldErrors.name}
              </span>
            ) : null}
          </Label>
          <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
            Unidade
            <Select
              value={unit}
              onValueChange={(value) => onUnitChange(value as ProductUnit)}
            >
              <SelectTrigger
                aria-label='Unidade'
                className='h-10 w-full rounded-xl px-3 text-sm'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
        </div>
        <fieldset
          aria-describedby={
            fieldErrors.categories ? 'product-categories-error' : undefined
          }
          aria-invalid={Boolean(fieldErrors.categories)}
        >
          <legend className='mb-2 text-xs font-semibold text-muted-foreground'>
            Categorias
          </legend>
          <div className='grid gap-2 sm:grid-cols-2'>
            {CATEGORY_VALUES.map((category) => {
              const isSelected = categories.includes(category)
              const isDisabled = isCategoryDisabled(category)
              return (
                <label
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                    isSelected
                      ? `${CATEGORY_STYLES[category].selected} font-bold`
                      : 'border-border hover:bg-muted',
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                  htmlFor={`product-category-${category}`}
                  key={category}
                >
                  <Checkbox
                    checked={isSelected}
                    className={CATEGORY_STYLES[category].checkbox}
                    disabled={isDisabled}
                    id={`product-category-${category}`}
                    onCheckedChange={(checked) => {
                      if (checked !== isSelected) onCategoryToggle(category)
                    }}
                  />
                  <span className='truncate'>{CATEGORY_LABELS[category]}</span>
                </label>
              )
            })}
          </div>
          {categories.includes('portion') || categories.includes('resale') ? (
            <p className='mt-2 text-xs text-muted-foreground'>
              Porção e Revenda não podem ser selecionadas juntas.
            </p>
          ) : null}
          {fieldErrors.categories ? (
            <p
              className='mt-2 text-sm font-semibold text-destructive'
              id='product-categories-error'
              role='alert'
            >
              {fieldErrors.categories}
            </p>
          ) : null}
        </fieldset>
      </CardContent>
    </Card>
    {children}
  </form>
)
