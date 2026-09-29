import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SalesChannelsActionDialogs } from './action-dialogs'
import { ChannelSearch } from './channel-search'
import { SalesChannelsFeedback } from './sales-channels-feedback'
import { SalesChannelsResults } from './sales-channels-results'
import { useSalesChannelsPage } from './use-sales-channels-page'

export type SalesChannelsPageProps = {
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
  searchFilter?: string
  onSearchFilterChange: (filter: string | undefined) => void
}

export const SalesChannelsPage = ({
  adjustmentFilter,
  onAdjustmentFilterChange,
  searchFilter,
  onSearchFilterChange,
}: SalesChannelsPageProps) => {
  const page = useSalesChannelsPage(searchFilter)

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-[28px] font-extrabold tracking-tight sm:text-[30px]'>
            Canais de venda
          </h1>
          <p className='mt-1 max-w-2xl text-sm font-medium text-muted-foreground'>
            {page.canManageSalesChannels
              ? 'Configure ajustes percentuais para delivery, balcão e outros contextos de venda.'
              : 'Consulte os canais de venda e os ajustes aplicados aos pedidos.'}
          </p>
        </div>
        {page.canManageSalesChannels ? (
          <Button
            className='min-h-10 self-start shadow-primary sm:self-auto'
            onClick={page.handleCreate}
            type='button'
          >
            <Icon name='plus' /> Novo canal
          </Button>
        ) : null}
      </header>
      <ChannelSearch
        onSearchFilterChange={onSearchFilterChange}
        searchFilter={searchFilter}
      />
      <SalesChannelsFeedback
        actionError={page.actionError}
        announcement={page.announcement}
        isRefreshing={page.isRefreshingSalesChannels}
      />
      <SalesChannelsResults
        adjustmentFilter={adjustmentFilter}
        canManage={page.canManageSalesChannels}
        channels={page.salesChannels}
        isError={page.isSalesChannelsError}
        isLoading={page.isLoadingSalesChannels}
        isReactivatePending={page.isReactivating}
        matchingChannels={page.matchingChannels}
        onAdd={page.handleCreate}
        onAdjustmentFilterChange={onAdjustmentFilterChange}
        onDelete={page.handleDelete}
        onEdit={page.handleEdit}
        onInactivate={page.handleInactivate}
        onReactivate={(channel) => page.handleStatusChange(channel, 'active')}
        onRetry={page.handleRetry}
        onSearchFilterChange={onSearchFilterChange}
      />
      <SalesChannelsActionDialogs
        canManage={page.canManageSalesChannels}
        onOpenChange={page.handleOpenChange}
        onStatusChange={page.handleStatusChange}
        onSuccess={page.handleSuccess}
        selectedAction={page.selectedAction}
      />
    </section>
  )
}
