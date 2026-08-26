import { useState } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import { useInactivateSalesChannelAction } from '@/ui/pdv/hooks/use-inactivate-sales-channel-action'

export type ChangeSalesChannelStatusDialogHookProps = {
  channel: SalesChannel
  onSuccess: (message: string) => void
}

export function useChangeSalesChannelStatusDialog({
  channel,
  onSuccess,
}: ChangeSalesChannelStatusDialogHookProps) {
  const { inactivateSalesChannel, isPending } = useInactivateSalesChannelAction()
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleConfirm() {
    if (isPending) return
    setActionError(null)
    try {
      await inactivateSalesChannel(channel.id)
      onSuccess('Canal inativado com sucesso.')
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível inativar o canal. Tente novamente.',
      )
    }
  }

  return {
    actionError,
    handleConfirm,
    isPending,
  }
}
