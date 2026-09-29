import type { ResalePricing } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ReadOnlyResaleListProps = {
  formatCurrency: (value: number) => string
  formatQuantity: (value: number, unit: string) => string
  items: readonly ResalePricing[]
}

export const ReadOnlyResaleList = ({
  formatCurrency,
  formatQuantity,
  items,
}: ReadOnlyResaleListProps) => (
  <div className='mt-6 grid gap-3'>
    {items.map((item) => (
      <div
        className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-soft p-4'
        key={item.brand?.id ?? 'single'}
      >
        <div>
          <h3 className='font-extrabold'>{item.brand?.name ?? 'Produto avulso'}</h3>
          <p className='text-sm text-muted-foreground'>
            {item.brand
              ? `${formatQuantity(item.packageQuantity, 'un')} por venda`
              : 'Uma unidade de estoque por venda'}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <span className='font-bold'>
            {item.price === undefined
              ? 'Preço não configurado'
              : formatCurrency(item.price)}
          </span>
          <Badge variant={item.isActive ? 'outline' : 'secondary'}>
            {item.isActive ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>
      </div>
    ))}
  </div>
)

export const NoResaleBrandsState = () => (
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
)
