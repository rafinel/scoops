import { useEffect, useRef, useState } from 'react'
import { DashboardPeriodControl } from './dashboard-period-control'
import { DashboardSummary } from './dashboard-summary'
import { DashboardSalesStatus } from './dashboard-sales-status'
import { StockAttentionWidget } from './stock-attention'
import { SalesEvolution } from './sales-evolution'
import { ProductPerformance } from './product-performance'
import { ChannelPerformance } from './channel-performance'
import { CostCoverageDialog } from './cost-coverage-dialog'
import { useDashboardPage } from './use-dashboard-page'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'
import { useAnalyticsInteraction } from '@/ui/analytics/hooks/use-analytics-interaction'

const PERIOD_LABELS = {
  today: 'Hoje',
  'last-7-days': 'Últimos 7 dias',
  'last-30-days': 'Últimos 30 dias',
  'last-90-days': 'Últimos 90 dias',
} as const

export const DashboardPage = () => {
  const page = useDashboardPage()
  const logInteraction = useAnalyticsInteraction()
  const hasLoggedView = useRef(false)
  const [coverageOpen, setCoverageOpen] = useState(false)
  const formatDate = useFormatDate()
  useEffect(() => {
    if (!hasLoggedView.current) {
      hasLoggedView.current = true
      logInteraction({
        event: 'dashboard-viewed',
        period: page.period,
        target: 'dashboard',
        source: 'ui',
      })
    }
    if (page.sales.isStale) {
      logInteraction({
        event: 'stale-presented',
        period: page.period,
        target: 'summary',
        source: 'sales',
      })
    } else if (page.sales.error && !page.sales.data) {
      logInteraction({
        event: 'source-failure',
        period: page.period,
        target: 'summary',
        source: 'sales',
      })
    }
    if (page.stock.isStale) {
      logInteraction({
        event: 'stale-presented',
        period: page.period,
        target: 'stock',
        source: 'stock',
      })
    } else if (page.stock.error && !page.stock.data) {
      logInteraction({
        event: 'source-failure',
        period: page.period,
        target: 'stock',
        source: 'stock',
      })
    }
  }, [
    logInteraction,
    page.period,
    page.sales.data,
    page.sales.error,
    page.sales.isStale,
    page.stock.data,
    page.stock.error,
    page.stock.isStale,
  ])
  const salesLoading = page.sales.isLoading && !page.sales.data
  const stockLoading = page.stock.isLoading && !page.stock.data
  return (
    <main
      className='flex w-full min-w-0 flex-1 flex-col space-y-5 px-4'
      aria-labelledby='dashboard-heading'
    >
      <header className='flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1
            id='dashboard-heading'
            className='mt-2 text-3xl font-extrabold tracking-tight'
          >
            Dashboard
          </h1>
          <p className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Icon name='circle-check' className='size-3.5 text-success' /> Atualizado{' '}
            {page.sales.data
              ? `em ${formatDate(page.sales.data.updatedAt, { hour: '2-digit', minute: '2-digit' })}`
              : 'agora'}
          </p>
        </div>
        <DashboardPeriodControl
          period={page.period}
          onChange={page.setPeriod}
          onRefresh={() => void page.refresh()}
          isRefreshing={page.isRefreshing}
        />
      </header>
      <div className='flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground'>
        <Icon name='calendar' className='size-4 text-primary' />
        <strong className='text-foreground'>
          {page.sales.data
            ? `${formatDate(page.sales.data.selected.localStartDate)}–${formatDate(page.sales.data.selected.localEndDate)}`
            : PERIOD_LABELS[page.period]}
        </strong>
        {page.sales.data ? (
          <>
            comparado com{' '}
            <strong className='text-foreground'>
              {formatDate(page.sales.data.comparison.localStartDate)}–
              {formatDate(page.sales.data.comparison.localEndDate)}
            </strong>
          </>
        ) : null}
      </div>
      {salesLoading ? (
        <section
          role='status'
          aria-label='Carregando vendas'
          aria-busy='true'
          className='grid overflow-hidden rounded-2xl border bg-card shadow-card sm:grid-cols-2 xl:grid-cols-4'
        >
          <div className='space-y-3 border-b p-4 sm:border-r xl:border-b-0'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-3 w-28' />
          </div>
          <div className='space-y-3 border-b p-4 xl:border-b-0 xl:border-r'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3 w-28' />
          </div>
          <div className='space-y-3 border-b p-4 sm:border-r xl:border-b-0'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-8 w-28' />
            <Skeleton className='h-3 w-28' />
          </div>
          <div className='space-y-3 p-4'>
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        </section>
      ) : page.sales.error && !page.sales.data ? (
        <section
          role='alert'
          className='rounded-xl border border-danger/20 bg-card p-5 text-sm text-danger'
        >
          Não foi possível carregar vendas.{' '}
          <button
            type='button'
            className='font-bold underline'
            onClick={() => void page.sales.refetch()}
          >
            Tentar novamente
          </button>
        </section>
      ) : page.sales.data ? (
        <>
          {page.sales.isStale ? (
            <div
              role='status'
              className='rounded-xl border border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning'
            >
              Dados de vendas desatualizados.{' '}
              <button
                type='button'
                className='font-bold underline'
                onClick={() => void page.sales.refetch()}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}
          <DashboardSummary
            analytics={page.sales.data}
            onCoverageDetails={() => {
              setCoverageOpen(true)
              logInteraction({
                event: 'cost-review-opened',
                period: page.period,
                target: 'cost-coverage',
                source: 'ui',
              })
            }}
          />
        </>
      ) : null}
      {page.sales.data && page.sales.data.cancellations.count > 0 ? (
        <section className='flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm'>
          <Icon name='triangle-alert' className='mt-0.5 size-4 shrink-0 text-danger' />
          <p>
            <strong>
              {page.sales.data.cancellations.count} cancelamentos no período ·{' '}
            </strong>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(page.sales.data.cancellations.valueCents / 100)}
            <span className='block text-xs text-muted-foreground'>
              Podem incluir pedidos registrados em períodos anteriores.
            </span>
          </p>
        </section>
      ) : null}
      <div className='grid min-w-0 gap-5 lg:grid-cols-2'>
        {salesLoading ? (
          <section
            aria-hidden='true'
            className='order-2 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-2 lg:row-start-1'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-52' />
                <Skeleton className='h-4 w-72 max-w-full' />
              </div>
              <div className='flex gap-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
            <div className='relative mt-6 h-64 overflow-hidden rounded-xl bg-muted/30'>
              <div className='absolute inset-x-8 top-5 grid grid-rows-4 gap-11'>
                <span className='border-t border-dashed border-border-soft' />
                <span className='border-t border-dashed border-border-soft' />
                <span className='border-t border-dashed border-border-soft' />
                <span className='border-t border-dashed border-border-soft' />
              </div>
              <div className='absolute inset-x-8 bottom-8 flex h-44 items-end gap-2'>
                <Skeleton className='h-8 flex-1 rounded-t-md' />
                <Skeleton className='h-14 flex-1 rounded-t-md' />
                <Skeleton className='h-10 flex-1 rounded-t-md' />
                <Skeleton className='h-24 flex-1 rounded-t-md' />
                <Skeleton className='h-16 flex-1 rounded-t-md' />
                <Skeleton className='h-32 flex-1 rounded-t-md' />
                <Skeleton className='h-20 flex-1 rounded-t-md' />
                <Skeleton className='h-28 flex-1 rounded-t-md' />
                <Skeleton className='h-12 flex-1 rounded-t-md' />
                <Skeleton className='h-24 flex-1 rounded-t-md' />
                <Skeleton className='h-16 flex-1 rounded-t-md' />
                <Skeleton className='h-28 flex-1 rounded-t-md' />
              </div>
              <Skeleton className='absolute inset-x-8 bottom-4 h-px rounded-none' />
            </div>
            <Skeleton className='mt-5 h-4 w-32' />
          </section>
        ) : page.sales.data ? (
          <div className='order-2 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1'>
            <DashboardSalesStatus hasSalesData={page.sales.data.summary.validOrders > 0}>
              <section className='rounded-2xl border bg-card p-5 shadow-card'>
                <SalesEvolution analytics={page.sales.data} />
              </section>
            </DashboardSalesStatus>
          </div>
        ) : null}
        {stockLoading ? (
          <section
            role='status'
            aria-label='Carregando estoque'
            aria-busy='true'
            className='order-1 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-1 lg:row-start-1'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-36' />
                <Skeleton className='h-4 w-52 max-w-full' />
              </div>
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='mt-6 space-y-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='size-10 rounded-xl' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <Skeleton className='h-4 w-2/5' />
                  <Skeleton className='h-3 w-3/5' />
                </div>
                <Skeleton className='h-4 w-16' />
              </div>
              <div className='flex items-center gap-4'>
                <Skeleton className='size-10 rounded-xl' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <Skeleton className='h-4 w-1/3' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
                <Skeleton className='h-4 w-20' />
              </div>
              <div className='flex items-center gap-4'>
                <Skeleton className='size-10 rounded-xl' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <Skeleton className='h-4 w-2/5' />
                  <Skeleton className='h-3 w-3/5' />
                </div>
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
          </section>
        ) : page.stock.error && !page.stock.data ? (
          <section
            role='alert'
            className='order-1 rounded-2xl border border-danger/20 bg-card p-5 text-sm text-danger lg:order-none lg:col-start-1 lg:row-start-1'
          >
            Não foi possível carregar estoque.{' '}
            <button
              type='button'
              className='font-bold underline'
              onClick={() => void page.stock.refetch()}
            >
              Tentar novamente
            </button>
          </section>
        ) : page.stock.data ? (
          <div className='order-1 min-w-0 lg:order-none lg:col-start-1 lg:row-start-1'>
            {page.stock.isStale ? (
              <div
                role='status'
                className='mb-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-2 text-sm text-warning'
              >
                Dados de estoque desatualizados.{' '}
                <button
                  type='button'
                  className='font-bold underline'
                  onClick={() => void page.stock.refetch()}
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}
            <StockAttentionWidget stock={page.stock.data} />
          </div>
        ) : null}
        {salesLoading ? (
          <section
            aria-hidden='true'
            className='order-3 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-1 lg:row-start-2'
          >
            <Skeleton className='h-6 w-44' />
            <Skeleton className='mt-2 h-4 w-56 max-w-full' />
            <div className='mt-6 space-y-4'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-11/12' />
              <Skeleton className='h-12 w-10/12' />
            </div>
          </section>
        ) : page.sales.data && page.sales.data.summary.validOrders > 0 ? (
          <section className='order-3 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-1 lg:row-start-2'>
            <ProductPerformance analytics={page.sales.data} />
          </section>
        ) : null}
        {salesLoading ? (
          <section
            aria-hidden='true'
            className='order-4 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-2 lg:row-start-2'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-4 w-52 max-w-full' />
              </div>
              <Skeleton className='size-5 rounded-full' />
            </div>
            <div className='mt-6 space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-11/12' />
              <Skeleton className='h-10 w-10/12' />
            </div>
          </section>
        ) : page.sales.data && page.sales.data.summary.validOrders > 0 ? (
          <section className='order-4 rounded-2xl border bg-card p-5 shadow-card lg:order-none lg:col-start-2 lg:row-start-2'>
            <ChannelPerformance analytics={page.sales.data} />
          </section>
        ) : null}
      </div>
      <CostCoverageDialog
        open={coverageOpen}
        onClose={() => setCoverageOpen(false)}
        analytics={page.sales.data}
      />
    </main>
  )
}
