import type { ProductCategory, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { useState, type FormEvent, type ReactNode } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import { Card, CardContent } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
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
import { Icon } from '@/ui/shared/widgets/components/icon'
import { CategoryGuidanceDialog } from '../category-guidance-dialog'
import type {
  ProductRegistrationFieldErrors,
  ProductRegistrationFormValues,
} from '../use-product-registration-page'
import { ProductSalePriceFields } from './product-sale-price-fields'

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
    checkbox:
      'data-checked:border-category-ingredient data-checked:bg-category-ingredient',
    selected:
      'border-category-ingredient-border bg-category-ingredient-bg text-category-ingredient',
  },
  manufacturable: {
    checkbox:
      'data-checked:border-category-manufacturable data-checked:bg-category-manufacturable',
    selected:
      'border-category-manufacturable-border bg-category-manufacturable-bg text-category-manufacturable',
  },
  portion: {
    checkbox: 'data-checked:border-category-portion data-checked:bg-category-portion',
    selected:
      'border-category-portion-border bg-category-portion-bg text-category-portion',
  },
  accompaniment: {
    checkbox:
      'data-checked:border-category-accompaniment data-checked:bg-category-accompaniment',
    selected:
      'border-category-accompaniment-border bg-category-accompaniment-bg text-category-accompaniment',
  },
  resale: {
    checkbox: 'data-checked:border-category-resale data-checked:bg-category-resale',
    selected: 'border-category-resale-border bg-category-resale-bg text-category-resale',
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
  accompanimentPrice: string
  categories: ProductCategory[]
  children: ReactNode
  fieldErrors: ProductRegistrationFieldErrors
  isAccompanimentPriceVisible: boolean
  isCategoryDisabled: (category: ProductCategory) => boolean
  isResalePriceVisible: boolean
  name: string
  onAccompanimentPriceChange: (value: string) => void
  onCategoryToggle: (category: ProductCategory) => void
  onNameChange: (value: string) => void
  onResalePriceChange: (value: string) => void
  onUnitChange: (value: ProductUnit) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  register: UseFormRegister<ProductRegistrationFormValues>
  resalePrice: string
  unit: ProductUnit
}
export const ProductRegistrationForm = ({
  accompanimentPrice,
  categories,
  children,
  fieldErrors,
  isAccompanimentPriceVisible,
  isCategoryDisabled,
  isResalePriceVisible,
  name,
  onAccompanimentPriceChange,
  onCategoryToggle,
  onNameChange,
  onResalePriceChange,
  onSubmit,
  onUnitChange,
  register,
  resalePrice,
  unit,
}: ProductRegistrationFormProps) => (
  <form className='space-y-4' noValidate onSubmit={onSubmit}>
    <Card className='py-0'>
      <CardContent className='grid gap-4 p-3.5'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-sm font-extrabold'>Catálogo</h2>
          <CategoryGuidanceHelp />
        </div>
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
                className='w-full rounded-xl px-3 text-sm'
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
          aria-describedby={fieldErrors.categories ? CATEGORY_ERROR_ID : undefined}
          aria-invalid={Boolean(fieldErrors.categories)}
        >
          <legend className={CATEGORY_LEGEND_CLASS}>Categorias</legend>
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
              id={CATEGORY_ERROR_ID}
              role='alert'
            >
              {fieldErrors.categories}
            </p>
          ) : null}
        </fieldset>
        <ProductSalePriceFields
          accompanimentPrice={accompanimentPrice}
          fieldErrors={fieldErrors}
          isAccompanimentPriceVisible={isAccompanimentPriceVisible}
          isResalePriceVisible={isResalePriceVisible}
          onAccompanimentPriceChange={onAccompanimentPriceChange}
          onResalePriceChange={onResalePriceChange}
          register={register}
          resalePrice={resalePrice}
        />
      </CardContent>
    </Card>
    {children}
  </form>
)

const CATEGORY_ERROR_ID = 'product-categories-error'
const CATEGORY_LEGEND_CLASS = 'mb-2 text-xs font-semibold text-muted-foreground'
const CATEGORY_GUIDANCE_BUTTON_PROPS = {
  className: 'h-8 shrink-0 gap-1 px-2 text-xs font-bold text-primary',
  type: 'button',
  variant: 'ghost',
} as const
const CATEGORY_GUIDANCE_ICON_CLASS = 'size-3.5'

const CategoryGuidanceHelp = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button {...CATEGORY_GUIDANCE_BUTTON_PROPS} onClick={() => setOpen(true)}>
        <Icon name='info' className={CATEGORY_GUIDANCE_ICON_CLASS} />
        Entenda as categorias
      </Button>
      <CategoryGuidanceDialog onOpenChange={setOpen} open={open} />
    </>
  )
}
