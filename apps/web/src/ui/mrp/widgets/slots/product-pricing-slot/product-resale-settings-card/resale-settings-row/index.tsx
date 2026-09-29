import type { ResalePricing } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ProductResaleRowState } from '../use-product-resale-settings-card'

export type ResaleSettingsRowProps = {
  description?: string
  isSingle: boolean
  item?: ResalePricing
  label?: string
  onSave: () => void
  onValueChange: (field: 'price' | 'isActive', value: string | boolean) => void
  row?: ProductResaleRowState
  unitLabel?: string
}

export const ResaleSettingsRow = (props: ResaleSettingsRowProps) =>
  props.isSingle ? (
    <SingleResaleSettingsRow {...props} />
  ) : (
    <BrandResaleSettingsRow {...props} />
  )

const SingleResaleSettingsRow = (props: ResaleSettingsRowProps) => (
  <div className='mt-6 rounded-xl border border-border-soft p-4 sm:p-5'>
    <div className='grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
      <ResalePriceField {...props} isSingle />
      <ResaleAvailability {...props} isSingle />
    </div>
    <ResaleSingleGuidance />
  </div>
)

const BrandResaleSettingsRow = (props: ResaleSettingsRowProps) => (
  <div className='grid gap-4 rounded-xl border border-border-soft p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
    <BrandDescription {...props} />
    <div className='grid gap-3 sm:min-w-[330px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
      <ResalePriceField {...props} isSingle={false} />
      <ResaleAvailability {...props} isSingle={false} />
    </div>
  </div>
)

const BrandDescription = ({
  description,
  item,
  label,
  unitLabel,
}: ResaleSettingsRowProps) => (
  <div className='min-w-0'>
    <div className='flex flex-wrap items-center gap-2'>
      <h3 className='font-extrabold'>{label ?? item?.brand?.name ?? 'Marca'}</h3>
      <Badge variant={(item?.isActive ?? false) ? 'outline' : 'secondary'}>
        {(item?.isActive ?? false) ? 'Disponível' : 'Indisponível'}
      </Badge>
    </div>
    <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    {unitLabel ? (
      <p className='mt-2 text-xs font-semibold text-muted-foreground'>{unitLabel}</p>
    ) : null}
  </div>
)

const ResalePriceField = ({
  isSingle,
  item,
  label,
  onValueChange,
  row,
}: ResaleSettingsRowProps) => {
  const rowId = item?.brand?.id ?? 'single'
  return (
    <div className='grid gap-2'>
      <Label className='text-sm font-bold' htmlFor={`resale-price-${rowId}`}>
        {isSingle ? 'Preço de venda' : 'Preço'}
      </Label>
      <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
        <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
          R$
        </span>
        <Input
          aria-label={
            isSingle ? undefined : `Preço ${label ?? item?.brand?.name ?? 'Marca'}`
          }
          aria-invalid={Boolean(row?.error)}
          className='h-10 rounded-none border-0 shadow-none focus-visible:ring-0'
          data-focus-ring='delegated'
          disabled={row?.isPending ?? false}
          id={`resale-price-${rowId}`}
          inputMode='decimal'
          onChange={(event) => onValueChange('price', event.target.value)}
          value={row?.price ?? ''}
        />
        {isSingle ? (
          <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
            / un
          </span>
        ) : null}
      </div>
      {row?.error ? (
        <span className='text-sm font-semibold text-destructive' role='alert'>
          {row.error}
        </span>
      ) : null}
    </div>
  )
}

const ResaleAvailability = ({
  isSingle,
  label,
  onSave,
  onValueChange,
  row,
  item,
}: ResaleSettingsRowProps) => {
  const rowId = item?.brand?.id ?? 'single'
  return (
    <div className='flex flex-wrap items-center gap-3'>
      {isSingle ? (
        <span className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
          Disponibilidade
        </span>
      ) : null}
      <label
        className='inline-flex items-center gap-2 text-sm font-bold'
        htmlFor={`resale-active-${rowId}`}
      >
        <input
          aria-label={
            isSingle
              ? 'Disponível no PDV'
              : `Disponibilidade ${label ?? item?.brand?.name ?? 'Marca'}`
          }
          checked={row?.isActive ?? false}
          className='peer sr-only'
          disabled={row?.isPending ?? false}
          id={`resale-active-${rowId}`}
          onChange={(event) => onValueChange('isActive', event.target.checked)}
          type='checkbox'
        />
        <span className='relative h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none' />
        <span className={isSingle ? '' : 'sr-only'}>
          {isSingle ? 'Disponível no PDV' : 'Disponível'}
        </span>
      </label>
      <Button
        disabled={row?.isPending ?? false}
        onClick={onSave}
        type='button'
        variant='outline'
      >
        {row?.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </div>
  )
}

const ResaleSingleGuidance = () => (
  <div className='mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground'>
    <Icon className='mt-0.5 size-4 shrink-0' name='info' />
    <p>
      Cada venda baixa 1 unidade do estoque. Modificadores do PDV se aplicam sobre o
      preço.
    </p>
  </div>
)
