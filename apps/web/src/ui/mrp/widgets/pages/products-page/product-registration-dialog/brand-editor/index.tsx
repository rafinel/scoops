import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { BrandDraft } from '../use-product-registration-dialog'

export type BrandEditorProps = {
  brand: BrandDraft
  index: number
  onChange: (changes: Partial<BrandDraft>) => void
  onRemove: () => void
  unit: ProductUnit
}

export const BrandEditor = ({
  brand,
  index,
  onChange,
  onRemove,
  unit,
}: BrandEditorProps) => (
  <div className='rounded-2xl border bg-card p-5'>
    <div className='mb-4 flex items-center justify-between'>
      <span className='grid size-7 place-items-center rounded-full bg-accent text-sm font-bold text-primary'>
        {index + 1}
      </span>
      <Button
        aria-label={`Remover marca ${index + 1}`}
        className='text-muted-foreground hover:text-foreground disabled:opacity-40'
        disabled={index === 0}
        onClick={onRemove}
        size='icon-sm'
        type='button'
        variant='ghost'
      >
        <Icon name='trash-2' className='size-4' />
      </Button>
    </div>
    <div className='grid gap-4 sm:grid-cols-2'>
      <Label className='grid gap-2 text-sm font-semibold text-muted-foreground'>
        Nome
        <Input
          className='h-10 rounded-xl px-3 text-sm'
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder='Ex: Frooty'
          value={brand.name}
        />
      </Label>
      <Label className='grid gap-2 text-sm font-semibold text-muted-foreground'>
        Qtd. por embalagem
        <div className='flex h-10 items-center rounded-xl border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
          <Input
            className='h-full border-0 px-3 text-sm shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0'
            data-focus-ring='delegated'
            min='0'
            onChange={(event) => onChange({ packageQuantity: event.target.value })}
            type='number'
            value={brand.packageQuantity}
          />
          <span className='h-full shrink-0 whitespace-nowrap border-l bg-muted/30 px-3 py-2 text-sm font-semibold text-muted-foreground'>
            {unit}
          </span>
        </div>
      </Label>
      <Label className='grid gap-2 text-sm font-semibold text-muted-foreground sm:col-span-2'>
        Valor por embalagem
        <div className='flex h-10 items-center rounded-xl border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
          <span className='h-full shrink-0 whitespace-nowrap border-r bg-muted/30 px-3 py-2 text-sm font-semibold text-muted-foreground'>
            R$
          </span>
          <Input
            className='h-full min-w-0 flex-1 border-0 px-3 text-sm shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0'
            data-focus-ring='delegated'
            onChange={(event) => onChange({ packagePrice: event.target.value })}
            value={brand.packagePrice}
          />
        </div>
      </Label>
      <Label className='grid gap-2 text-sm font-semibold text-muted-foreground sm:col-span-2'>
        Quantidade de embalagens
        <Input
          className='h-10 rounded-xl px-3 text-sm'
          min='0'
          onChange={(event) => onChange({ packageCount: event.target.value })}
          type='number'
          value={brand.packageCount}
        />
      </Label>
    </div>
    <label className='mt-4 flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold'>
      <input
        checked={brand.isPrimary}
        className='peer sr-only'
        onChange={() => onChange({ isPrimary: !brand.isPrimary })}
        type='checkbox'
      />
      <span
        aria-hidden='true'
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${brand.isPrimary ? 'bg-primary' : 'bg-border'}`}
      >
        <span
          className={`absolute left-1 top-1 size-5 rounded-full bg-white transition-transform ${brand.isPrimary ? 'translate-x-5' : ''}`}
        />
      </span>
      Marca principal
    </label>
  </div>
)
