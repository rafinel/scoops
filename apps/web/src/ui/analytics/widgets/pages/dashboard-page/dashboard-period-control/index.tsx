import type { AnalyticsPeriod } from '@scoops/core/analytics/domain/structures'
import { Icon } from '@/ui/shared/widgets/components/icon'

const periods: readonly [AnalyticsPeriod, string][] = [
  ['today', 'Hoje'],
  ['last-7-days', '7 dias'],
  ['last-30-days', '30 dias'],
  ['last-90-days', '90 dias'],
]

export const DashboardPeriodControl = ({
  period,
  onChange,
  onRefresh,
  isRefreshing,
}: {
  period: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
  onRefresh: () => void
  isRefreshing: boolean
}) => (
  <fieldset className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
    <legend className='sr-only'>Período do dashboard</legend>
    <div className='min-w-0 flex-1 rounded-lg border bg-card p-1 sm:flex-none'>
      <label className='sr-only' htmlFor='dashboard-period-select'>
        Período do dashboard
      </label>
      <select
        id='dashboard-period-select'
        className='h-9 w-full rounded-md bg-card px-2 text-sm font-semibold sm:hidden'
        value={period}
        onChange={(event) => onChange(event.target.value as AnalyticsPeriod)}
      >
        {periods.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className='hidden gap-1 sm:flex'>
        {periods.map(([value, label]) => (
          <button
            key={value}
            type='button'
            aria-pressed={period === value}
            className='min-w-0 whitespace-nowrap rounded-md px-2 py-2 text-xs font-semibold data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground sm:px-3 sm:text-sm'
            data-selected={period === value}
            onClick={() => onChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
    <button
      type='button'
      className='inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-70 sm:w-auto'
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
    >
      {isRefreshing ? (
        <Icon name='refresh' className='size-4 motion-safe:animate-spin' />
      ) : null}
      Atualizar
    </button>
  </fieldset>
)
