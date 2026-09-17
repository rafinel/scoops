import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SalesEvolutionTableDialog } from './sales-evolution-table-dialog'
import { useSalesEvolution } from './use-sales-evolution'

export type SalesEvolutionProps = {
  analytics: SalesAnalytics
}

export const SalesEvolution = ({ analytics }: SalesEvolutionProps) => {
  const { isTableDialogOpen, handleOpenTableDialog, handleTableDialogOpenChange } =
    useSalesEvolution()

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)

  return (
    <section aria-labelledby='sales-evolution-heading'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h2 id='sales-evolution-heading' className='text-lg font-extrabold'>
            Evolução das vendas
          </h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            Valor vendido e quantidade de pedidos válidos
          </p>
        </div>
        <div className='hidden gap-4 text-xs text-muted-foreground sm:flex'>
          <span>
            <i className='mr-1 inline-block size-2 rounded-sm bg-primary' />
            Vendas líquidas
          </span>
          <span>
            <i className='mr-1 inline-block size-2 rounded-full bg-chart-5' />
            Pedidos
          </span>
        </div>
      </div>
      <div className='mt-4 h-64' role='img' aria-label='Gráfico de vendas e pedidos'>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={analytics.evolution} accessibilityLayer>
            <CartesianGrid stroke='var(--border)' strokeDasharray='3 3' />
            <XAxis
              dataKey='label'
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              yAxisId='sales'
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickFormatter={(value) => `R$ ${Math.round(value / 100)}`}
            />
            <YAxis
              yAxisId='orders'
              orientation='right'
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [
                name === 'Vendas líquidas' ? formatCurrency(Number(value)) : value,
                name,
              ]}
            />
            <Bar
              yAxisId='sales'
              dataKey='netSalesCents'
              name='Vendas líquidas'
              fill='var(--primary)'
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId='orders'
              dataKey='validOrders'
              name='Pedidos'
              stroke='var(--chart-5)'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <Button
        type='button'
        variant='link'
        size='sm'
        className='mt-2 h-auto gap-2 border-0 px-0 text-xs font-bold focus-visible:border-0'
        onClick={handleOpenTableDialog}
        aria-expanded={isTableDialogOpen}
        aria-haspopup='dialog'
      >
        <Icon name='clipboard-list' className='size-4' /> Ver dados em tabela
      </Button>
      <SalesEvolutionTableDialog
        analytics={analytics}
        open={isTableDialogOpen}
        onOpenChange={handleTableDialogOpenChange}
      />
    </section>
  )
}
