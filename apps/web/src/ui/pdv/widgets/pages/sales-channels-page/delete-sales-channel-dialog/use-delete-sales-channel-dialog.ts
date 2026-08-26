import { useState } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import { useDeleteSalesChannelAction } from '@/ui/pdv/hooks/use-delete-sales-channel-action'

export type DeleteSalesChannelDialogHookProps = {
  channel: SalesChannel
  onSuccess: (message: string) => void
}

export function useDeleteSalesChannelDialog({
  channel,
  onSuccess,
}: DeleteSalesChannelDialogHookProps) {
  const { deleteSalesChannel, isPending } = useDeleteSalesChannelAction()
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirm() {
    if (isPending) return
    setActionError(null)
    try {
      await deleteSalesChannel(channel.id)
      onSuccess('Canal excluído com sucesso.')
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível excluir o canal. Tente novamente.',
      )
    }
  }

  return {
    actionError,
    handleConfirm,
    isPending,
  }
}
