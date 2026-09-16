import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  )

export const ChannelPerformance = ({ analytics }: { analytics: SalesAnalytics }) => (
  <section aria-labelledby='channel-performance-heading'>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <h2 id='channel-performance-heading' className='text-lg font-extrabold'>
          Canais de venda
        </h2>
        <p className='mt-1 text-xs text-muted-foreground'>
          Participação nas vendas líquidas
        </p>
      </div>
      <Anchor
        route='salesChannels'
        aria-label='Ver canais de venda'
        className='text-primary'
      >
        ↗
      </Anchor>
    </div>
    <ul className='mt-5 space-y-4'>
      {analytics.channels.map((channel, index) => (
        <li key={`${channel.snapshotId ?? 'none'}-${channel.name}`}>
          <div className='flex justify-between gap-3 text-sm font-bold'>
            <span>{channel.name}</span>
            <span>
              {formatCurrency(channel.netSalesCents)} ·{' '}
              {channel.sharePercentage.toFixed(0)}%
            </span>
          </div>
          <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted'>
            <div
              className={`h-full rounded-full ${index % 3 === 0 ? 'bg-primary' : index % 3 === 1 ? 'bg-chart-5' : 'bg-success'}`}
              style={{ width: `${Math.min(100, channel.sharePercentage)}%` }}
            />
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {channel.validOrders} pedidos · ticket{' '}
            {formatCurrency(channel.averageTicketCents)}
          </p>
        </li>
      ))}
    </ul>
  </section>
)
