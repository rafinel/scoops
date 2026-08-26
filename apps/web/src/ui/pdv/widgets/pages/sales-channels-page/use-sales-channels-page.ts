import { useState } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'

import { useReactivateSalesChannelAction } from '@/ui/pdv/hooks/use-reactivate-sales-channel-action'
import { useSalesChannelsQuery } from '@/ui/pdv/hooks/use-sales-channels-query'

export type SalesChannelsAction =
  | { kind: 'create' }
  | { kind: 'edit'; channel: SalesChannel }
  | { kind: 'inactivate'; channel: SalesChannel }
  | { kind: 'delete'; channel: SalesChannel }

export function useSalesChannelsPage() {
  const {
    isLoadingSalesChannels,
    isSalesChannelsError,
    refetchSalesChannels,
    salesChannels,
  } = useSalesChannelsQuery()
  const { isPending: isReactivating, reactivateSalesChannel } =
    useReactivateSalesChannelAction()
  const [selectedAction, setSelectedAction] = useState<SalesChannelsAction>()
  const [actionError, setActionError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  function handleSelectAction(action: SalesChannelsAction) {
    setActionError(null)
    setSelectedAction(action)
  }

  function handleOpenChange(open: boolean) {
    if (!open) setSelectedAction(undefined)
  }

  function handleCreate() {
    handleSelectAction({ kind: 'create' })
  }

  function handleEdit(channel: SalesChannel) {
    handleSelectAction({ channel, kind: 'edit' })
  }

  function handleInactivate(channel: SalesChannel) {
    handleSelectAction({ channel, kind: 'inactivate' })
  }

  function handleDelete(channel: SalesChannel) {
    handleSelectAction({ channel, kind: 'delete' })
  }

  async function handleStatusChange(channel: SalesChannel, status: SalesChannelStatus) {
    if (status === 'inactive') handleInactivate(channel)
    else await handleReactivate(channel)
  }

  function handleSuccess(message: string) {
    setSelectedAction(undefined)
    setActionError(null)
    setAnnouncement(message)
  }

  async function handleReactivate(channel: SalesChannel) {
    setActionError(null)
    try {
      await reactivateSalesChannel(channel.id)
      handleSuccess(`${channel.name} foi reativado.`)
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível reativar o canal. Tente novamente.',
      )
    }
  }

  function handleRetry() {
    void refetchSalesChannels()
  }

  return {
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
  }
}
