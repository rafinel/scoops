import { useState, type Dispatch, type SetStateAction } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useReactivateSalesChannelAction } from '@/ui/pdv/hooks/use-reactivate-sales-channel-action'
import { useSalesChannelsQuery } from '@/ui/pdv/hooks/use-sales-channels-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export type SalesChannelsAction =
  | { kind: 'create' }
  | { kind: 'edit'; channel: SalesChannel }
  | { kind: 'inactivate'; channel: SalesChannel }
  | { kind: 'delete'; channel: SalesChannel }

const createSalesChannelPageHandlers = ({
  reactivateSalesChannel,
  refetchSalesChannels,
  setSelectedAction,
  setActionError,
  setAnnouncement,
}: {
  reactivateSalesChannel: (id: string) => Promise<unknown>
  refetchSalesChannels: () => Promise<unknown>
  setSelectedAction: Dispatch<SetStateAction<SalesChannelsAction | undefined>>
  setActionError: Dispatch<SetStateAction<string | null>>
  setAnnouncement: Dispatch<SetStateAction<string>>
}) => {
  function handleSelectAction(action: SalesChannelsAction) {
    setActionError(null)
    setSelectedAction(action)
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
  return {
    handleSuccess,
    handleOpenChange(open: boolean) {
      if (!open) setSelectedAction(undefined)
    },
    handleCreate() {
      handleSelectAction({ kind: 'create' })
    },
    handleEdit(channel: SalesChannel) {
      handleSelectAction({ channel, kind: 'edit' })
    },
    handleInactivate(channel: SalesChannel) {
      handleSelectAction({ channel, kind: 'inactivate' })
    },
    handleDelete(channel: SalesChannel) {
      handleSelectAction({ channel, kind: 'delete' })
    },
    async handleStatusChange(channel: SalesChannel, status: SalesChannelStatus) {
      if (status === 'inactive') handleSelectAction({ channel, kind: 'inactivate' })
      else await handleReactivate(channel)
    },
    handleRetry() {
      void refetchSalesChannels()
    },
  }
}

export function useSalesChannelsPage(searchFilter?: string) {
  const { account } = useAuthContext()
  const {
    isLoadingSalesChannels,
    isRefreshingSalesChannels,
    isSalesChannelsError,
    refetchSalesChannels,
    salesChannels,
  } = useSalesChannelsQuery()
  const { isPending: isReactivating, reactivateSalesChannel } =
    useReactivateSalesChannelAction()
  const [selectedAction, setSelectedAction] = useState<SalesChannelsAction>()
  const [actionError, setActionError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const handlers = createSalesChannelPageHandlers({
    reactivateSalesChannel,
    refetchSalesChannels,
    setSelectedAction,
    setActionError,
    setAnnouncement,
  })
  const normalizedSearchFilter = searchFilter?.trim().toLocaleLowerCase()
  const matchingChannels = normalizedSearchFilter
    ? salesChannels.filter((channel) =>
        channel.name.toLocaleLowerCase().includes(normalizedSearchFilter),
      )
    : salesChannels

  return {
    actionError,
    announcement,
    canManageSalesChannels: account?.profile === UserProfile.Manager,
    isLoadingSalesChannels,
    isRefreshingSalesChannels,
    isReactivating,
    isSalesChannelsError,
    ...handlers,
    matchingChannels,
    salesChannels,
    selectedAction,
  }
}
