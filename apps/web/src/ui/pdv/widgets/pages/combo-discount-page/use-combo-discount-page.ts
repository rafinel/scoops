import { useState } from 'react'

import type { DiscountStatus } from '@scoops/core/pdv/domain/structures'

import { useComboQuery } from '@/ui/pdv/hooks/use-combo-query'
import { useCreateComboAction } from '@/ui/pdv/hooks/use-create-combo-action'
import { useUpdateComboAction } from '@/ui/pdv/hooks/use-update-combo-action'
import type {
  ComboDiscountFormMode,
  ComboDiscountFormValues,
} from './combo-discount-form/use-combo-discount-form'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type ComboDiscountPageMode = ComboDiscountFormMode

export type ComboDiscountPageProps = {
  comboId?: string
  mode: ComboDiscountPageMode
}

export function useComboDiscountPage({ comboId, mode }: ComboDiscountPageProps) {
  const { navigateTo } = useNavigation()
  const {
    comboDetails,
    comboDetailsError,
    isComboDetailsError,
    isLoadingComboDetails,
    refetchComboDetails,
  } = useComboQuery(mode === 'edit' ? comboId : undefined)
  const { createCombo, isPending: isCreating } = useCreateComboAction()
  const { isPending: isUpdating, updateCombo } = useUpdateComboAction()
  const [statusTarget, setStatusTarget] = useState<DiscountStatus>()
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const isPending = isCreating || isUpdating

  async function handleSubmit(values: ComboDiscountFormValues) {
    setSubmitError(null)
    try {
      if (mode === 'create') {
        await createCombo(values)
        setAnnouncement('Combo criado com sucesso.')
        await navigateTo('discounts')
        return
      }
      if (!comboId || !comboDetails) return
      await updateCombo({
        comboId,
        input: {
          components: values.components,
          expectedUpdatedAt: comboDetails.combo.updatedAt,
          fixedPrice: values.fixedPrice,
          name: values.name,
        },
      })
      setAnnouncement('Combo atualizado com sucesso.')
      await refetchComboDetails()
    } catch (caught) {
      setSubmitError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível salvar o Combo. Tente novamente.',
      )
    }
  }

  function handleRequestStatusChange(status: DiscountStatus) {
    if (!comboDetails || status === comboDetails.combo.status) return
    setSubmitError(null)
    setStatusTarget(status)
  }

  function handleStatusOpenChange(open: boolean) {
    if (!open) setStatusTarget(undefined)
  }

  async function handleStatusSuccess(message: string) {
    setStatusTarget(undefined)
    setAnnouncement(message)
    await refetchComboDetails()
  }

  function handleRequestDelete() {
    setSubmitError(null)
    setDeleteOpen(true)
  }

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open)
  }

  async function handleDeleteSuccess() {
    setDeleteOpen(false)
    setAnnouncement('Combo excluído com sucesso.')
    await navigateTo('discounts')
  }

  function handleRetry() {
    void refetchComboDetails()
  }

  function handleCancel() {
    void navigateTo('discounts')
  }

  return {
    announcement,
    comboDetails,
    comboDetailsError,
    handleCancel,
    handleDeleteOpenChange,
    handleDeleteSuccess,
    handleRequestDelete,
    handleRequestStatusChange,
    handleRetry,
    handleStatusOpenChange,
    handleStatusSuccess,
    handleSubmit,
    isComboDetailsError,
    isDeleteOpen,
    isLoadingComboDetails,
    isPending,
    statusTarget,
    submitError,
  }
}
