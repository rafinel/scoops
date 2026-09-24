import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const DashboardSummary = ({
  analytics,
  onCoverageDetails = () => undefined,
}: {
  analytics: SalesAnalytics
  onCoverageDetails?: () => void
}) => (
  <section
    aria-labelledby='dashboard-summary-heading'
    className='grid overflow-hidden rounded-2xl border bg-card shadow-card sm:grid-cols-2 xl:grid-cols-4'
  >
    <h2 id='dashboard-summary-heading' className='sr-only'>
      Resumo de vendas
    </h2>
    <Metric
      icon='credit-card'
      label='Vendas líquidas'
      value={formatCurrency(analytics.summary.netSalesCents)}
      comparison={analytics.summary.comparison.netSales}
      formatAbsolute={formatCurrency}
    />
    <Metric
      icon='clipboard-list'
      label='Pedidos válidos'
      value={String(analytics.summary.validOrders)}
      comparison={analytics.summary.comparison.validOrders}
    />
    <Metric
      icon='calculator'
      label='Ticket médio'
      value={
        analytics.summary.averageTicketCents === null
          ? 'Indisponível'
          : formatCurrency(analytics.summary.averageTicketCents)
      }
      comparison={analytics.summary.comparison.averageTicket}
      formatAbsolute={formatCurrency}
    />
    <div className='border-b p-4 sm:border-r xl:border-b-0 xl:border-r-0'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
          Margem bruta estimada
        </p>
        <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning'>
          <Icon name='calculator' className='size-4' />
        </span>
      </div>
      <p className='mt-2 text-2xl font-extrabold tracking-tight'>
        {analytics.margin.grossMarginCents === null
          ? 'Indisponível'
          : formatCurrency(analytics.margin.grossMarginCents)}
      </p>
      <p className='mt-3 text-xs text-muted-foreground'>
        Cobertura {analytics.margin.coveragePercentage.toFixed(0)}%
        <button
          type='button'
          className='ml-2 font-bold text-warning underline-offset-2 hover:underline'
          onClick={onCoverageDetails}
        >
          Detalhes da cobertura
        </button>
      </p>
    </div>
  </section>
)

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )

const Metric = ({
  comparison,
  formatAbsolute = (value: number) => value.toLocaleString('pt-BR'),
  icon,
  label,
  value,
}: {
  comparison: { absolute: number; percentage: number | null }
  formatAbsolute?: (value: number) => string
  icon: 'calculator' | 'clipboard-list' | 'credit-card'
  label: string
  value: string
}) => (
  <div className='border-b p-4 sm:border-r xl:border-b-0'>
    <div className='flex items-start justify-between gap-3'>
      <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
        {label}
      </p>
      <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary'>
        <Icon name={icon} className='size-4' />
      </span>
    </div>
    <p className='mt-2 text-2xl font-extrabold tracking-tight'>{value}</p>
    <Comparison comparison={comparison} formatAbsolute={formatAbsolute} />
  </div>
)

const Comparison = ({
  comparison,
  formatAbsolute,
}: {
  comparison: { absolute: number; percentage: number | null }
  formatAbsolute: (value: number) => string
}) => {
  const direction =
    comparison.absolute === 0 ? 'neutral' : comparison.absolute > 0 ? 'up' : 'down'
  const icon =
    direction === 'up'
      ? 'arrow-up'
      : direction === 'down'
        ? 'arrow-down'
        : 'arrow-down-up'
  const tone =
    direction === 'neutral'
      ? 'text-muted-foreground'
      : direction === 'up'
        ? 'text-success'
        : 'text-danger'
  const absoluteDifference =
    comparison.absolute > 0
      ? `+${formatAbsolute(comparison.absolute)}`
      : formatAbsolute(comparison.absolute)
  return (
    <p className={`mt-3 space-y-1 text-xs ${tone}`}>
      <span className='flex items-center gap-1'>
        <Icon name={icon} className='size-3.5 shrink-0' aria-hidden='true' />
        <span className='font-bold'>
          {comparison.percentage === null
            ? 'Sem base de comparação'
            : `${comparison.percentage >= 0 ? '+' : ''}${comparison.percentage.toFixed(1)}%`}
        </span>
      </span>
      <span className='block pl-5 text-muted-foreground'>
        Diferença: {absoluteDifference}
      </span>
    </p>
  )
}
