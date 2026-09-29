import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'

import { ChangeSalesChannelStatusDialog } from '../change-sales-channel-status-dialog'
import { DeleteSalesChannelDialog } from '../delete-sales-channel-dialog'
import { SalesChannelDialog } from '../sales-channel-dialog'
import type { SalesChannelsAction } from '../use-sales-channels-page'

export const SalesChannelsActionDialogs = ({
  canManage,
  selectedAction,
  onOpenChange,
  onStatusChange,
  onSuccess,
}: {
  canManage: boolean
  selectedAction: SalesChannelsAction | undefined
  onOpenChange: (open: boolean) => void
  onStatusChange: (channel: SalesChannel, status: SalesChannelStatus) => void
  onSuccess: (message: string) => void
}) => {
  if (!canManage || !selectedAction) return null
  if (selectedAction.kind === 'create') {
    return (
      <SalesChannelDialog
        mode='add'
        onOpenChange={onOpenChange}
        onRequestStatusChange={onStatusChange}
        onSuccess={onSuccess}
        open
      />
    )
  }
  if (selectedAction.kind === 'edit') {
    return (
      <SalesChannelDialog
        channel={selectedAction.channel}
        mode='edit'
        onOpenChange={onOpenChange}
        onRequestStatusChange={onStatusChange}
        onSuccess={onSuccess}
        open
      />
    )
  }
  if (selectedAction.kind === 'inactivate') {
    return (
      <ChangeSalesChannelStatusDialog
        channel={selectedAction.channel}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
      />
    )
  }
  return (
    <DeleteSalesChannelDialog
      channel={selectedAction.channel}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
    />
  )
}
