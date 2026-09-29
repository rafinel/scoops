import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Card, CardContent, CardFooter } from '@/ui/shadcn/card'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SalesChannelsDesktopTable } from './sales-channels-desktop-table'
import { SalesChannelsMobileList } from './sales-channels-mobile-list'
import { useSalesChannelsList } from './use-sales-channels-list'

export type SalesChannelsListProps = {
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  canManageSalesChannels: boolean
  channels: readonly SalesChannel[]
  isReactivatePending?: boolean
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
  onDelete: (channel: SalesChannel) => void
  onEdit: (channel: SalesChannel) => void
  onInactivate: (channel: SalesChannel) => void
  onReactivate: (channel: SalesChannel) => void
}

function formatPercentage(
  value: number,
  formatDecimal: (value: number) => string,
): string {
  if (value === 0) return '0%'
  const sign = value > 0 ? '+' : '−'
  return `${sign}${formatDecimal(Math.abs(value))}%`
}

function getAdjustmentType(value: number): string {
  if (value > 0) return 'Acréscimo'
  if (value < 0) return 'Desconto'
  return 'Neutro'
}

function getAdjustmentClass(value: number): string {
  if (value > 0) return 'text-warning'
  if (value < 0) return 'text-info'
  return 'text-foreground'
}

function getTypeClass(value: number): string {
  if (value > 0) return 'bg-warning-soft text-warning'
  if (value < 0) return 'bg-info-soft text-info'
  return 'bg-muted text-muted-foreground'
}

export const SalesChannelsList = ({
  adjustmentFilter,
  canManageSalesChannels,
  channels,
  isReactivatePending = false,
  onAdjustmentFilterChange,
  onDelete,
  onEdit,
  onInactivate,
  onReactivate,
}: SalesChannelsListProps) => {
  const formatDecimal = useFormatDecimal()
  const { filteredChannels } = useSalesChannelsList(channels, adjustmentFilter)
  const activeCount = filteredChannels.filter(
    (channel) => channel.status === 'active',
  ).length
  const inactiveCount = filteredChannels.length - activeCount
  const formatChannelPercentage = (value: number) =>
    formatPercentage(value, formatDecimal)

  return (
    <Card
      aria-label='Canais de venda cadastrados'
      className='rounded-2xl border py-0 shadow-none'
    >
      <SalesChannelsDesktopTable
        adjustmentFilter={adjustmentFilter}
        canManageSalesChannels={canManageSalesChannels}
        channels={filteredChannels}
        totalChannels={channels.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        formatPercentage={formatChannelPercentage}
        getAdjustmentClass={getAdjustmentClass}
        getAdjustmentType={getAdjustmentType}
        getTypeClass={getTypeClass}
        isReactivatePending={isReactivatePending}
        onAdjustmentFilterChange={onAdjustmentFilterChange}
        onClearFilter={() => onAdjustmentFilterChange(undefined)}
        onDelete={onDelete}
        onEdit={onEdit}
        onInactivate={onInactivate}
        onReactivate={onReactivate}
      />
      <CardContent className='p-0'>
        <SalesChannelsMobileList
          canManageSalesChannels={canManageSalesChannels}
          channels={filteredChannels}
          formatPercentage={formatChannelPercentage}
          getAdjustmentClass={getAdjustmentClass}
          getAdjustmentType={getAdjustmentType}
          getTypeClass={getTypeClass}
          isReactivatePending={isReactivatePending}
          onDelete={onDelete}
          onEdit={onEdit}
          onInactivate={onInactivate}
          onReactivate={onReactivate}
        />
      </CardContent>
      <CardFooter className='gap-2 px-5 py-3 text-xs text-muted-foreground sm:px-6'>
        <Icon name='shield-check' className='size-4 shrink-0' />
        <p>
          Pedidos anteriores preservam o nome e o percentual usados, mesmo após edição ou
          exclusão.
        </p>
      </CardFooter>
    </Card>
  )
}
