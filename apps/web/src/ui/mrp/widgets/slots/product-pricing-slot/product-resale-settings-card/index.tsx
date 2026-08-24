import type {
  ProductPricingDetails,
  ResalePricing,
} from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import { useProductResaleSettingsCard } from './use-product-resale-settings-card'

export type ProductResaleSettingsCardProps = {
  details: ProductPricingDetails
  productId: string
}

export const ProductResaleSettingsCard = ({
  details,
  productId,
}: ProductResaleSettingsCardProps) => {
  const { handleSave, handleValueChange, rows } = useProductResaleSettingsCard(
    details,
    productId,
  )
  const formatQuantity = useFormatQuantity()
  const isSingle = details.mode === 'resale-single'

  return (
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div>
        <h2 className='text-lg font-extrabold'>Preço de Revenda</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {isSingle
            ? 'O produto é vendido avulso como uma unidade da unidade de estoque.'
            : 'Cada marca é vendida avulsa como uma unidade da embalagem cadastrada.'}
        </p>
      </div>

      {isSingle ? (
        <SingleResaleRow
          item={details.resale[0]}
          row={rows.single}
          onSave={() => void handleSave('single')}
          onValueChange={(field, value) => handleValueChange('single', field, value)}
        />
      ) : details.resale.length === 0 ? (
        <div className='mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-6'>
          <div className='flex items-start gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning'>
              <Icon name='store' />
            </span>
            <div>
              <h3 className='font-extrabold'>Nenhuma marca cadastrada</h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Cadastre uma marca em Estoque antes de configurar a revenda por marca.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {details.resale.map((item) => {
            const key = item.brand?.id ?? 'missing-brand'
            return (
              <BrandResaleRow
                formatQuantity={formatQuantity}
                item={item}
                key={key}
                row={rows[key]}
                onSave={() => void handleSave(key)}
                onValueChange={(field, value) => handleValueChange(key, field, value)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

type ResaleRowProps = {
  item?: ResalePricing
  row?: {
    error?: string
    isActive: boolean
    isPending: boolean
    price: string
  }
  onSave: () => void
  onValueChange: (field: 'price' | 'isActive', value: string | boolean) => void
}

type BrandResaleRowProps = ResaleRowProps & {
  formatQuantity: (value: number, unit: string) => string
}

const SingleResaleRow = ({ item, onSave, onValueChange, row }: ResaleRowProps) => {
  const isAvailable = row?.isActive ?? false
  const isPending = row?.isPending ?? false
  const rowId = item?.brand?.id ?? 'single'

  return (
    <div className='mt-6 rounded-xl border border-border-soft p-4 sm:p-5'>
      <div className='grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
        <div className='grid gap-2'>
          <Label
            className='text-xs font-bold uppercase tracking-wide text-muted-foreground'
            htmlFor={`resale-price-${rowId}`}
          >
            Preço de venda
          </Label>
          <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
              R$
            </span>
            <Input
              aria-invalid={Boolean(row?.error)}
              className='h-10 rounded-none border-0 shadow-none focus-visible:ring-0'
              data-focus-ring='delegated'
              disabled={isPending}
              id={`resale-price-${rowId}`}
              inputMode='decimal'
              onChange={(event) => onValueChange('price', event.target.value)}
              value={row?.price ?? ''}
            />
            <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
              / un
            </span>
          </div>
          {row?.error ? (
            <span className='text-sm font-semibold text-destructive' role='alert'>
              {row.error}
            </span>
          ) : null}
        </div>

        <div className='grid gap-2'>
          <span className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
            Disponibilidade
          </span>
          <div className='flex flex-wrap items-center gap-3'>
            <label
              className='inline-flex items-center gap-2 text-sm font-bold'
              htmlFor={`resale-active-${rowId}`}
            >
              <input
                aria-label='Disponível no PDV'
                checked={isAvailable}
                className='peer sr-only'
                disabled={isPending}
                id={`resale-active-${rowId}`}
                onChange={(event) => onValueChange('isActive', event.target.checked)}
                type='checkbox'
              />
              <span className='relative h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none' />
              <span>Disponível no PDV</span>
            </label>
            <Button disabled={isPending} onClick={onSave} type='button' variant='outline'>
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      <div className='mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground'>
        <Icon className='mt-0.5 size-4 shrink-0' name='info' />
        <p>
          Cada venda baixa 1 unidade do estoque. Modificadores do PDV se aplicam sobre o
          preço.
        </p>
      </div>
    </div>
  )
}

const BrandResaleRow = ({ formatQuantity, item, ...props }: BrandResaleRowProps) => (
  <ResaleRow
    {...props}
    description='A embalagem é herdada do cadastro atual da marca.'
    item={item}
    label={item?.brand?.name ?? 'Marca'}
    unitLabel={
      item?.brand
        ? formatQuantity(item.packageQuantity, 'un').replace(' un', ' por venda')
        : ''
    }
  />
)

const ResaleRow = ({
  description,
  item,
  label,
  onSave,
  onValueChange,
  row,
  unitLabel,
}: ResaleRowProps & { description: string; label: string; unitLabel: string }) => {
  const rowId = item?.brand?.id ?? 'single'
  const isAvailable = row?.isActive ?? false
  const isPending = row?.isPending ?? false

  return (
    <div className='grid gap-4 rounded-xl border border-border-soft p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='font-extrabold'>{label}</h3>
          <Badge variant={isAvailable ? 'outline' : 'secondary'}>
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        {unitLabel ? (
          <p className='mt-2 text-xs font-semibold text-muted-foreground'>{unitLabel}</p>
        ) : null}
      </div>

      <div className='grid gap-3 sm:min-w-[330px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
        <label className='grid gap-2 text-sm font-bold' htmlFor={`resale-price-${rowId}`}>
          Preço
          <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
              R$
            </span>
            <Input
              aria-label={`Preço ${label}`}
              aria-invalid={Boolean(row?.error)}
              className='h-10 rounded-none border-0 shadow-none focus-visible:ring-0'
              data-focus-ring='delegated'
              disabled={isPending}
              id={`resale-price-${rowId}`}
              inputMode='decimal'
              onChange={(event) => onValueChange('price', event.target.value)}
              value={row?.price ?? ''}
            />
          </div>
          {row?.error ? (
            <span className='text-sm font-semibold text-destructive' role='alert'>
              {row.error}
            </span>
          ) : null}
        </label>
        <div className='flex items-center gap-2'>
          <label
            className='flex items-center gap-2 text-sm font-bold'
            htmlFor={`resale-active-${rowId}`}
          >
            <input
              aria-label={`Disponibilidade ${label}`}
              checked={isAvailable}
              className='peer sr-only'
              disabled={isPending}
              id={`resale-active-${rowId}`}
              onChange={(event) => onValueChange('isActive', event.target.checked)}
              type='checkbox'
            />
            <span className='relative h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none' />
            <span className='sr-only'>Disponível</span>
          </label>
          <Button disabled={isPending} onClick={onSave} type='button' variant='outline'>
            {isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
