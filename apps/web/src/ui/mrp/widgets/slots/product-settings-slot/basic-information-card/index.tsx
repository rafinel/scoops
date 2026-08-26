import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductStatus, type ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useBasicInformationCard } from './use-basic-information-card'
import { Field } from './field'
import { RecoveryActions } from './recovery-actions'

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
  const {
    errors,
    handleIdealStockBlur,
    handleIdealStockChange,
    handleNameBlur,
    handleNameChange,
    handleRetry,
    handleRevert,
    handleStatusChange,
    handleUnitChange,
    idealStock,
    isPending,
    name,
    pendingField,
    status,
    unitTriggerRef,
  } = useBasicInformationCard(product, onUnitChange)

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
            error={errors.name}
            errorId='basic-information-name-error'
            label='Nome do produto'
          >
            <Input
              aria-describedby={errors.name ? 'basic-information-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              disabled={isPending && pendingField === 'name'}
              onBlur={handleNameBlur}
              onChange={(event) => handleNameChange(event.target.value)}
              value={name}
            />
          </Field>
          <RecoveryActions
            error={errors.name}
            onRetry={() => handleRetry('name')}
            onRevert={() => handleRevert('name')}
          />
        </div>
        <Field label='Unidade de estoque'>
          <Select
            value={product.unit}
            onValueChange={(value) => handleUnitChange(value as ProductUnit)}
          >
            <SelectTrigger
              aria-label='Unidade de estoque'
              className='w-full'
              ref={unitTriggerRef}
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
            error={errors.idealStock}
            errorId='basic-information-ideal-stock-error'
            label='Estoque ideal'
          >
            <div className='flex overflow-hidden rounded-lg border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <Input
                aria-describedby={
                  errors.idealStock ? 'basic-information-ideal-stock-error' : undefined
                }
                aria-invalid={Boolean(errors.idealStock)}
                className='h-12 rounded-none border-0 shadow-none focus-visible:ring-0'
                disabled={isPending && pendingField === 'idealStock'}
                inputMode='decimal'
                onBlur={handleIdealStockBlur}
                onChange={(event) => handleIdealStockChange(event.target.value)}
                value={idealStock}
              />
              <span className='grid min-w-12 place-items-center border-l bg-muted px-2 text-sm font-bold text-muted-foreground'>
                {product.unit}
              </span>
            </div>
          </Field>
          <RecoveryActions
            error={errors.idealStock}
            onRetry={() => handleRetry('idealStock')}
            onRevert={() => handleRevert('idealStock')}
          />
        </div>
        <div>
          <Field
            error={errors.status}
            errorId='basic-information-status-error'
            label='Status'
          >
            <Select
              value={status}
              onValueChange={(value) => handleStatusChange(value as ProductStatus)}
            >
              <SelectTrigger
                aria-describedby={
                  errors.status ? 'basic-information-status-error' : undefined
                }
                aria-invalid={Boolean(errors.status)}
                aria-label='Status'
                className='w-full'
                disabled={isPending && pendingField === 'status'}
              >
                <SelectValue>{STATUS_LABELS[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProductStatus.Active}>Ativo</SelectItem>
                <SelectItem value={ProductStatus.Inactive}>Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <RecoveryActions
            error={errors.status}
            onRetry={() => handleRetry('status')}
            onRevert={() => handleRevert('status')}
          />
        </div>
      </div>
      {errors.name || errors.idealStock || errors.status ? (
        <div
          className='mt-4 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger'
          role='alert'
        >
          <Icon className='mt-0.5 size-4 shrink-0' name='triangle-alert' />
          <span>Corrija os campos destacados para salvar as informações.</span>
        </div>
      ) : null}
      {isPending ? (
        <p className='mt-3 text-xs font-semibold text-muted-foreground' role='status'>
          Salvando alteração…
        </p>
      ) : null}
    </section>
  )
}
