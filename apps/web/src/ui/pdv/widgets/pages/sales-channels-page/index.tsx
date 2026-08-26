import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ChangeSalesChannelStatusDialog } from './change-sales-channel-status-dialog'
import { DeleteSalesChannelDialog } from './delete-sales-channel-dialog'
import { SalesChannelDialog } from './sales-channel-dialog'
import { SalesChannelsEmptyState } from './sales-channels-empty-state'
import { SalesChannelsError } from './sales-channels-error'
import { SalesChannelsList } from './sales-channels-list'
import { SalesChannelsLoading } from './sales-channels-loading'
import { useSalesChannelsPage } from './use-sales-channels-page'

export type SalesChannelsPageProps = {
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
}

export const SalesChannelsPage = ({
  adjustmentFilter,
  onAdjustmentFilterChange,
}: SalesChannelsPageProps) => {
  const {
    actionError,
    announcement,
    isLoadingSalesChannels,
    isReactivating,
    isSalesChannelsError,
    handleCreate,
    handleDelete,
    handleEdit,
    handleInactivate,
    handleOpenChange,
    handleRetry,
    handleStatusChange,
    handleSuccess,
    salesChannels,
    selectedAction,
  } = useSalesChannelsPage()

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-[28px] font-extrabold tracking-tight sm:text-[30px]'>
            Canais de venda
          </h1>
          <p className='mt-1 max-w-2xl text-sm font-medium text-muted-foreground'>
            Configure ajustes percentuais para delivery, balcão e outros contextos de
            venda.
          </p>
        </div>
        <Button
          className='min-h-10 self-start shadow-primary sm:self-auto'
          onClick={handleCreate}
          type='button'
        >
          <Icon name='plus' /> Novo canal
        </Button>
      </header>
      <Card className='gap-0 rounded-2xl border py-0 shadow-none'>
        <CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
              <Icon name='calculator' className='size-5' />
            </span>
            <div className='min-w-0'>
              <h2 className='text-sm font-extrabold'>O canal é opcional</h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                Sem canal, o pedido mantém os preços-base. O percentual escolhido vale
                para todos os itens pagos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {actionError ? (
        <p
          aria-live='assertive'
          className='rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive'
          role='alert'
        >
          {actionError}
        </p>
      ) : null}
      <div aria-live='polite' className='sr-only' role='status'>
        {announcement}
      </div>
      {isLoadingSalesChannels ? (
        <SalesChannelsLoading />
      ) : isSalesChannelsError ? (
        <SalesChannelsError onRetry={handleRetry} />
      ) : salesChannels.length === 0 ? (
        <SalesChannelsEmptyState onAdd={handleCreate} />
      ) : (
        <SalesChannelsList
          adjustmentFilter={adjustmentFilter}
          channels={salesChannels}
          isReactivatePending={isReactivating}
          onAdjustmentFilterChange={onAdjustmentFilterChange}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onInactivate={handleInactivate}
          onReactivate={(channel) => handleStatusChange(channel, 'active')}
        />
      )}
      {selectedAction?.kind === 'create' ? (
        <SalesChannelDialog
          mode='add'
          onOpenChange={handleOpenChange}
          onRequestStatusChange={handleStatusChange}
          onSuccess={handleSuccess}
          open
        />
      ) : null}
      {selectedAction?.kind === 'edit' ? (
        <SalesChannelDialog
          channel={selectedAction.channel}
          mode='edit'
          onOpenChange={handleOpenChange}
          onRequestStatusChange={handleStatusChange}
          onSuccess={handleSuccess}
          open
        />
      ) : null}
      {selectedAction?.kind === 'inactivate' ? (
        <ChangeSalesChannelStatusDialog
          channel={selectedAction.channel}
          onOpenChange={handleOpenChange}
          onSuccess={handleSuccess}
          open
        />
      ) : null}
      {selectedAction?.kind === 'delete' ? (
        <DeleteSalesChannelDialog
          channel={selectedAction.channel}
          onOpenChange={handleOpenChange}
          onSuccess={handleSuccess}
          open
        />
      ) : null}
    </section>
  )
}
