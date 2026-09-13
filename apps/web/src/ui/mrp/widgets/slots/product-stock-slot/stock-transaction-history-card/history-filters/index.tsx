import type {
  ProductBrandStock,
  StockTransactionType,
} from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
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

import { STOCK_TRANSACTION_TYPE_LABELS } from '../transaction-type'

export type HistoryFiltersProps = {
  brandId: string
  brands: readonly ProductBrandStock[]
  from: string
  hasFilters: boolean
  onBrandChange: (value: string | null) => void
  onClearFilters: () => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onTypeChange: (value: string | null) => void
  selectedBrandName?: string
  to: string
  type: StockTransactionType | ''
}

export const HistoryFilters = ({
  brandId,
  brands,
  from,
  hasFilters,
  onBrandChange,
  onClearFilters,
  onFromChange,
  onToChange,
  onTypeChange,
  selectedBrandName,
  to,
  type,
}: HistoryFiltersProps) => (
  <div className='mt-4 grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap'>
    <Label className='sr-only' htmlFor='history-type'>
      Tipo
    </Label>
    <Select value={type || 'all'} onValueChange={onTypeChange}>
      <SelectTrigger
        aria-label='Tipo'
        className='h-10 w-full rounded-lg bg-card px-3 text-sm xl:w-auto'
        id='history-type'
      >
        <SelectValue>
          {type ? STOCK_TRANSACTION_TYPE_LABELS[type] : 'Tipo: Todos'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>Tipo: Todos</SelectItem>
        <SelectItem value='entry'>Entrada Manual</SelectItem>
        <SelectItem value='write-off'>Baixa Manual</SelectItem>
        <SelectItem value='sale'>Venda</SelectItem>
      </SelectContent>
    </Select>
    <Label className='sr-only' htmlFor='history-brand'>
      Marca
    </Label>
    <Select value={brandId || 'all'} onValueChange={onBrandChange}>
      <SelectTrigger
        aria-label='Marca'
        className='h-10 w-full rounded-lg bg-card px-3 text-sm xl:w-auto'
        id='history-brand'
      >
        <SelectValue>{selectedBrandName ?? 'Marca: Todas'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>Marca: Todas</SelectItem>
        {brands.map(({ brand }) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <label
      className='grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
      htmlFor='history-from'
    >
      De
      <Input
        id='history-from'
        className='border-0 p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
        data-focus-ring='delegated'
        onChange={(event) => onFromChange(event.target.value)}
        type='date'
        value={from}
      />
    </label>
    <label
      className='grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
      htmlFor='history-to'
    >
      Até
      <Input
        id='history-to'
        className='border-0 p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
        data-focus-ring='delegated'
        onChange={(event) => onToChange(event.target.value)}
        type='date'
        value={to}
      />
    </label>
    {hasFilters ? (
      <Button
        className='justify-start text-muted-foreground'
        onClick={onClearFilters}
        type='button'
        variant='ghost'
      >
        <Icon name='x' /> Limpar filtros
      </Button>
    ) : null}
  </div>
)
