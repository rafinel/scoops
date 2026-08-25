import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductStatus, type ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useBasicInformationCard } from './use-basic-information-card'

const UNIT_OPTIONS: readonly { value: ProductUnit; label: string }[] = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'un', label: 'Unidades (un)' },
]

const STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.Active]: 'Ativo',
  [ProductStatus.Inactive]: 'Inativo',
}

export type BasicInformationCardProps = {
  onUnitChange: (unit: ProductUnit, trigger: HTMLElement) => void
  product: Product
}

export const BasicInformationCard = ({
  onUnitChange,
  product,
}: BasicInformationCardProps) => {
  const state = useBasicInformationCard(product, onUnitChange)

  return (
    <section
      aria-labelledby='basic-information-title'
      className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
    >
      <div className='flex items-start gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
          <Icon name='name' />
        </span>
        <div>
          <h2 className='text-lg font-extrabold' id='basic-information-title'>
            Informações básicas
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Nome, unidade e estado do produto.
          </p>
        </div>
      </div>

      <div className='mt-6 grid gap-4 sm:grid-cols-2'>
        <div>
          <Field
            error={state.errors.name}
            errorId='basic-information-name-error'
            label='Nome do produto'
          >
            <Input
              aria-describedby={
                state.errors.name ? 'basic-information-name-error' : undefined
              }
              aria-invalid={Boolean(state.errors.name)}
              disabled={state.isPending && state.pendingField === 'name'}
              onBlur={state.handleNameBlur}
              onChange={(event) => state.handleNameChange(event.target.value)}
              value={state.name}
            />
          </Field>
          <RecoveryActions
            error={state.errors.name}
            onRetry={() => state.handleRetry('name')}
            onRevert={() => state.handleRevert('name')}
          />
        </div>
        <Field label='Unidade de estoque'>
          <Select
            value={product.unit}
            onValueChange={(value) => state.handleUnitChange(value as ProductUnit)}
          >
            <SelectTrigger
              aria-label='Unidade de estoque'
              className='w-full'
              ref={state.unitTriggerRef}
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
        </Field>
        <div>
          <Field
            error={state.errors.idealStock}
            errorId='basic-information-ideal-stock-error'
            label='Estoque ideal'
          >
            <div className='flex overflow-hidden rounded-lg border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <Input
                aria-describedby={
                  state.errors.idealStock
                    ? 'basic-information-ideal-stock-error'
                    : undefined
                }
                aria-invalid={Boolean(state.errors.idealStock)}
                className='h-12 rounded-none border-0 shadow-none focus-visible:ring-0'
                disabled={state.isPending && state.pendingField === 'idealStock'}
                inputMode='decimal'
                onBlur={state.handleIdealStockBlur}
                onChange={(event) => state.handleIdealStockChange(event.target.value)}
                value={state.idealStock}
              />
              <span className='grid min-w-12 place-items-center border-l bg-muted px-2 text-sm font-bold text-muted-foreground'>
                {product.unit}
              </span>
            </div>
          </Field>
          <RecoveryActions
            error={state.errors.idealStock}
            onRetry={() => state.handleRetry('idealStock')}
            onRevert={() => state.handleRevert('idealStock')}
          />
        </div>
        <div>
          <Field
            error={state.errors.status}
            errorId='basic-information-status-error'
            label='Status'
          >
            <Select
              value={state.status}
              onValueChange={(value) => state.handleStatusChange(value as ProductStatus)}
            >
              <SelectTrigger
                aria-describedby={
                  state.errors.status ? 'basic-information-status-error' : undefined
                }
                aria-invalid={Boolean(state.errors.status)}
                aria-label='Status'
                className='w-full'
                disabled={state.isPending && state.pendingField === 'status'}
              >
                <SelectValue>{STATUS_LABELS[state.status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProductStatus.Active}>Ativo</SelectItem>
                <SelectItem value={ProductStatus.Inactive}>Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <RecoveryActions
            error={state.errors.status}
            onRetry={() => state.handleRetry('status')}
            onRevert={() => state.handleRevert('status')}
          />
        </div>
      </div>
      {state.errors.name || state.errors.idealStock || state.errors.status ? (
        <div
          className='mt-4 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger'
          role='alert'
        >
          <Icon className='mt-0.5 size-4 shrink-0' name='triangle-alert' />
          <span>Corrija os campos destacados para salvar as informações.</span>
        </div>
      ) : null}
      {state.isPending ? (
        <p className='mt-3 text-xs font-semibold text-muted-foreground' role='status'>
          Salvando alteração…
        </p>
      ) : null}
    </section>
  )
}

function Field({
  children,
  error,
  errorId,
  label,
}: {
  children: React.ReactNode
  error?: string
  errorId?: string
  label: string
}) {
  return (
    <Label className='grid gap-2 text-sm font-bold'>
      {label}
      {children}
      {error ? (
        <span className='text-xs font-semibold text-danger' id={errorId} role='alert'>
          {error}
        </span>
      ) : null}
    </Label>
  )
}

function RecoveryActions({
  error,
  onRetry,
  onRevert,
}: {
  error?: string
  onRetry: () => void
  onRevert: () => void
}) {
  if (!error) return null
  return (
    <div className='mt-2 flex flex-wrap gap-2'>
      <button
        className='text-xs font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        onClick={onRetry}
        type='button'
      >
        Tentar novamente
      </button>
      <button
        className='text-xs font-bold text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        onClick={onRevert}
        type='button'
      >
        Reverter
      </button>
    </div>
  )
}
