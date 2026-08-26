import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'
import { salesChannelFormSchema } from '@scoops/validation'

import { useCreateSalesChannelAction } from '@/ui/pdv/hooks/use-create-sales-channel-action'
import { useUpdateSalesChannelAction } from '@/ui/pdv/hooks/use-update-sales-channel-action'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'

type SalesChannelFormInput = z.input<typeof salesChannelFormSchema>
type SalesChannelFormValues = z.output<typeof salesChannelFormSchema>

export type SalesChannelDialogMode = 'add' | 'edit'

export type SalesChannelDialogHookProps = {
  channel?: SalesChannel
  mode: SalesChannelDialogMode
  onOpenChange: (open: boolean) => void
  onRequestStatusChange: (channel: SalesChannel, status: SalesChannelStatus) => void
  onSuccess: (message: string) => void
  open: boolean
}

export function useSalesChannelDialog({
  channel,
  mode,
  onOpenChange,
  onRequestStatusChange,
  onSuccess,
  open,
}: SalesChannelDialogHookProps) {
  const formatCurrency = useFormatCurrency()
  const formatDecimal = useFormatDecimal()
  const { createSalesChannel, isPending: isCreating } = useCreateSalesChannelAction()
  const { isPending: isUpdating, updateSalesChannel } = useUpdateSalesChannelAction()
  const form = useForm<SalesChannelFormInput, undefined, SalesChannelFormValues>({
    defaultValues: channel
      ? {
          name: channel.name,
          percentage: formatDecimal(channel.percentage),
          variant: 'edit',
        }
      : {
          name: '',
          percentage: '0,00',
          status: 'active',
          variant: 'add',
        },
    resolver: zodResolver(salesChannelFormSchema),
  })
  const percentage = useWatch({ control: form.control, name: 'percentage' })
  const addStatus = useWatch({ control: form.control, name: 'status' })
  const currentStatus =
    mode === 'add' ? (addStatus ?? 'active') : (channel?.status ?? 'active')
  const percentageNumber = Number(String(percentage ?? '0').replace(',', '.')) || 0
  const adjustedExample = 20 + (20 * percentageNumber) / 100
  const isPending = isCreating || isUpdating
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    form.reset(
      channel
        ? {
            name: channel.name,
            percentage: formatDecimal(channel.percentage),
            variant: 'edit',
          }
        : {
            name: '',
            percentage: '0,00',
            status: 'active',
            variant: 'add',
          },
    )
    setActionError(null)
  }, [channel, form, formatDecimal, open])

  function handleStatusChange(nextStatus: SalesChannelStatus) {
    if (mode === 'add') {
      form.setValue('status', nextStatus, { shouldDirty: true, shouldValidate: true })
      return
    }
    if (!channel || nextStatus === channel.status) return
    onOpenChange(false)
    onRequestStatusChange(channel, nextStatus)
  }

  async function handleValidSubmit(values: SalesChannelFormValues) {
    setActionError(null)
    try {
      if (values.variant === 'add') {
        await createSalesChannel({
          name: values.name,
          percentage: values.percentage,
          status: values.status,
        })
        onSuccess('Canal criado com sucesso.')
      } else if (channel) {
        await updateSalesChannel({
          channelId: channel.id,
          input: { name: values.name, percentage: values.percentage },
        })
        onSuccess('Canal atualizado com sucesso.')
      }
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível salvar o canal. Tente novamente.',
      )
    }
  }

  return {
    actionError,
    adjustedExample,
    currentStatus,
    errors: form.formState.errors,
    formatCurrency,
    handleStatusChange,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    isPending,
    register: form.register,
  }
}
