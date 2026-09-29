import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import { Badge } from '@/ui/shadcn/badge'

import { SalesChannelRowActions } from '../sales-channel-row-actions'

export type SalesChannelsMobileListProps = {
  canManageSalesChannels: boolean
  channels: readonly SalesChannel[]
  formatPercentage: (value: number) => string
  getAdjustmentClass: (value: number) => string
  getAdjustmentType: (value: number) => string
  getTypeClass: (value: number) => string
  isReactivatePending: boolean
  onDelete: (channel: SalesChannel) => void
  onEdit: (channel: SalesChannel) => void
  onInactivate: (channel: SalesChannel) => void
  onReactivate: (channel: SalesChannel) => void
}

export const SalesChannelsMobileList = ({
  canManageSalesChannels,
  channels,
  formatPercentage,
  getAdjustmentClass,
  getAdjustmentType,
  getTypeClass,
  isReactivatePending,
  onDelete,
  onEdit,
  onInactivate,
  onReactivate,
}: SalesChannelsMobileListProps) => (
  <div className='grid gap-3 p-4 lg:hidden'>
    {channels.map((channel) => {
      const isActive = channel.status === 'active'

      return (
        <article
          className='grid gap-4 rounded-xl border border-border-soft bg-background p-4'
          key={channel.id}
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-extrabold'>{channel.name}</h3>
              <p
                className={`mt-1 text-lg font-extrabold ${getAdjustmentClass(channel.percentage)}`}
              >
                {formatPercentage(channel.percentage)}
              </p>
            </div>
            {canManageSalesChannels ? (
              <SalesChannelRowActions
                channel={channel}
                isReactivatePending={isReactivatePending}
                onDelete={() => onDelete(channel)}
                onEdit={() => onEdit(channel)}
                onToggleStatus={() =>
                  isActive ? onInactivate(channel) : onReactivate(channel)
                }
              />
            ) : null}
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3'>
            <Badge className={getTypeClass(channel.percentage)} variant='secondary'>
              {getAdjustmentType(channel.percentage)}
            </Badge>
            <Badge
              className={
                isActive
                  ? 'bg-success-soft text-success'
                  : 'bg-muted text-muted-foreground'
              }
              variant='secondary'
            >
              <span
                aria-hidden='true'
                className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground'}`}
              />
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </article>
      )
    })}
  </div>
)
