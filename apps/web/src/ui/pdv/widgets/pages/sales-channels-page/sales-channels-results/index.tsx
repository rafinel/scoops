import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Button } from '@/ui/shadcn/button'

import { SalesChannelsEmptyState } from '../sales-channels-empty-state'
import { SalesChannelsError } from '../sales-channels-error'
import { SalesChannelsList } from '../sales-channels-list'
import { SalesChannelsLoading } from '../sales-channels-loading'

export type SalesChannelsResultsProps = {
  canManage: boolean
  isLoading: boolean
  isError: boolean
  channels: readonly SalesChannel[]
  matchingChannels: readonly SalesChannel[]
  isReactivatePending: boolean
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
  onSearchFilterChange: (filter: string | undefined) => void
  onAdd: () => void
  onRetry: () => void
  onDelete: (channel: SalesChannel) => void
  onEdit: (channel: SalesChannel) => void
  onInactivate: (channel: SalesChannel) => void
  onReactivate: (channel: SalesChannel) => void
}

export const SalesChannelsResults = (props: SalesChannelsResultsProps) => {
  if (props.isLoading) return <SalesChannelsLoading />
  if (props.isError) return <SalesChannelsError onRetry={props.onRetry} />
  if (props.channels.length === 0) return <EmptyResults {...props} />
  if (props.matchingChannels.length === 0) {
    return (
      <div
        className='grid justify-items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-10 text-center'
        role='status'
      >
        <p className='text-sm font-bold'>Nenhum canal corresponde a esta busca.</p>
        <Button
          onClick={() => props.onSearchFilterChange(undefined)}
          type='button'
          variant='outline'
        >
          Limpar busca
        </Button>
      </div>
    )
  }
  return (
    <SalesChannelsList
      adjustmentFilter={props.adjustmentFilter}
      canManageSalesChannels={props.canManage}
      channels={props.matchingChannels}
      isReactivatePending={props.isReactivatePending}
      onAdjustmentFilterChange={props.onAdjustmentFilterChange}
      onDelete={props.onDelete}
      onEdit={props.onEdit}
      onInactivate={props.onInactivate}
      onReactivate={props.onReactivate}
    />
  )
}

const EmptyResults = (props: SalesChannelsResultsProps) =>
  props.canManage ? (
    <SalesChannelsEmptyState onAdd={props.onAdd} />
  ) : (
    <section
      aria-label='Canais cadastrados'
      className='rounded-2xl border border-dashed bg-card p-12 text-center'
      role='status'
    >
      <h2 className='text-lg font-extrabold'>Nenhum canal cadastrado</h2>
      <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
        Os canais de venda cadastrados pela sua equipe aparecerão aqui.
      </p>
    </section>
  )
