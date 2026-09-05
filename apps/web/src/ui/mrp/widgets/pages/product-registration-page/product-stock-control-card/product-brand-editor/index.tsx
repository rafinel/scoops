import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { BrandDraft } from '../../use-product-registration-page'

export type ProductBrandEditorProps = {
  allowNegativeStock: boolean
  brand: BrandDraft
  canRemove: boolean
  errors?: {
    name?: string
    packageCount?: string
    packagePrice?: string
    packageQuantity?: string
  }
  index: number
  onChange: (changes: Partial<BrandDraft>) => void
  onPrimaryChange: () => void
  onRemove: () => void
}

export const ProductBrandEditor = ({
  allowNegativeStock,
  brand,
  canRemove,
  errors,
  index,
  onChange,
  onPrimaryChange,
  onRemove,
}: ProductBrandEditorProps) => (
  <fieldset className='rounded-2xl border bg-muted/30 p-3 sm:p-4'>
    <legend className='sr-only'>Marca {index + 1}</legend>
    <div className='mb-3 flex items-center justify-between gap-3'>
      <span className='text-sm font-extrabold'>{index + 1}</span>
      <div className='flex items-center gap-3'>
        <label className='flex items-center gap-2 text-xs font-semibold text-muted-foreground'>
          Marca principal
          <input
            aria-label={`Marca principal ${index + 1}`}
            checked={brand.isPrimary}
            className='peer sr-only'
            name='primary-brand'
            onChange={onPrimaryChange}
            type='radio'
          />
          <span
            aria-hidden='true'
            className={`relative h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${brand.isPrimary ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute left-1 top-1 size-4 rounded-full bg-white transition-transform ${brand.isPrimary ? 'translate-x-5' : ''}`}
            />
          </span>
        </label>
        <Button
          aria-label={`Remover marca ${index + 1}`}
          className='text-muted-foreground hover:text-foreground'
          disabled={!canRemove}
          onClick={onRemove}
          size='icon-sm'
          type='button'
          variant='ghost'
        >
          <Icon name='trash-2' className='size-4' />
        </Button>
      </div>
    </div>
    <div className='grid gap-3 sm:grid-cols-2'>
      <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2'>
        Nome da marca
        <Input
          aria-describedby={errors?.name ? `brand-${index}-name-error` : undefined}
          aria-invalid={Boolean(errors?.name)}
          className='h-10 rounded-xl px-3 text-sm'
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder='Ex: Frooty'
          value={brand.name}
        />
        {errors?.name ? (
          <span className='text-sm text-destructive' id={`brand-${index}-name-error`}>
            {errors.name}
          </span>
        ) : null}
      </Label>
      <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
        Qtd. por embalagem
        <Input
          aria-describedby={
            errors?.packageQuantity ? `brand-${index}-package-quantity-error` : undefined
          }
          aria-invalid={Boolean(errors?.packageQuantity)}
          className='h-10 rounded-xl px-3 text-sm'
          inputMode='decimal'
          min='0'
          onChange={(event) => onChange({ packageQuantity: event.target.value })}
          type='text'
          value={brand.packageQuantity}
        />
        {errors?.packageQuantity ? (
          <span
            className='text-sm text-destructive'
            id={`brand-${index}-package-quantity-error`}
          >
            {errors.packageQuantity}
          </span>
        ) : null}
      </Label>
      <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
        Valor por embalagem
        <div className='flex min-w-0 overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
          <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-semibold text-muted-foreground'>
            R$
          </span>
          <Input
            aria-describedby={
              errors?.packagePrice ? `brand-${index}-package-price-error` : undefined
            }
            aria-invalid={Boolean(errors?.packagePrice)}
            className='h-10 min-w-0 flex-1 border-0 px-3 text-sm shadow-none focus-visible:ring-0'
            data-focus-ring='delegated'
            inputMode='decimal'
            onChange={(event) => onChange({ packagePrice: event.target.value })}
            value={brand.packagePrice}
          />
        </div>
        {errors?.packagePrice ? (
          <span
            className='text-sm text-destructive'
            id={`brand-${index}-package-price-error`}
          >
            {errors.packagePrice}
          </span>
        ) : null}
      </Label>
      <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
        Quantidade inicial de pacotes
        <Input
          aria-describedby={
            errors?.packageCount ? `brand-${index}-package-count-error` : undefined
          }
          aria-invalid={Boolean(errors?.packageCount)}
          className='h-10 rounded-xl px-3 text-sm sm:col-span-2'
          inputMode='decimal'
          min={allowNegativeStock ? undefined : '0'}
          onChange={(event) => onChange({ packageCount: event.target.value })}
          type='text'
          value={brand.packageCount}
        />
        {errors?.packageCount ? (
          <span
            className='text-sm text-destructive'
            id={`brand-${index}-package-count-error`}
          >
            {errors.packageCount}
          </span>
        ) : null}
      </Label>
    </div>
  </fieldset>
)
