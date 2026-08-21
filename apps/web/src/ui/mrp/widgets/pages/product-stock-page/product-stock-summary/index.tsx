import type { ProductUnit, StockSituation } from '@scoops/core/mrp/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductStockSummaryProps = {
  idealStock?: number
  stockQuantity: number
  stockSituation: StockSituation
  unit: ProductUnit
}

export const ProductStockSummary = ({
  idealStock,
  stockQuantity,
  stockSituation,
  unit,
}: ProductStockSummaryProps) => {
  const situationLabel = stockSituation === 'low' ? 'Abaixo do ideal' : 'Normal'

  return (
    <section aria-label='Resumo do estoque' className='grid gap-4 md:grid-cols-3'>
      <MetricCard label='Estoque total' value={formatQuantity(stockQuantity, unit)} />
      <MetricCard
        label='Estoque ideal'
        value={
          idealStock === undefined
            ? 'Sem meta definida'
            : formatQuantity(idealStock, unit)
        }
      />
      <article className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Situação do estoque
        </p>
        <p
          className={`mt-3 flex items-center gap-2 text-xl font-extrabold ${
            stockSituation === 'low' ? 'text-amber-700' : 'text-green-700'
          }`}
        >
          <Icon
            className='size-5'
            name={stockSituation === 'low' ? 'triangle-alert' : 'circle-check'}
          />
          {situationLabel}
        </p>
      </article>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <p className='mt-3 break-words text-2xl font-extrabold sm:text-3xl'>{value}</p>
    </article>
  )
}

function formatQuantity(quantity: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(quantity)} ${unit}`
}
