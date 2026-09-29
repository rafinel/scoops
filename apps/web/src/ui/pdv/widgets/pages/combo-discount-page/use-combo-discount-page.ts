import { useState, type Dispatch, type SetStateAction } from 'react'

import type { DiscountStatus } from '@scoops/core/pdv/domain/structures'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useComboQuery } from '@/ui/pdv/hooks/use-combo-query'
import { useCreateComboAction } from '@/ui/pdv/hooks/use-create-combo-action'
import { useUpdateComboAction } from '@/ui/pdv/hooks/use-update-combo-action'
import type {
  ComboDiscountFormMode,
  ComboDiscountFormValues,
} from './combo-discount-form/use-combo-discount-form'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export type ComboDiscountPageMode = ComboDiscountFormMode

export type ComboDiscountPageProps = {
  comboId?: string
  mode: ComboDiscountPageMode
}

type NavigateTo = ReturnType<typeof useNavigation>['navigateTo']

const createSubmitHandler =
  ({
    mode,
    comboId,
    comboDetails,
    createCombo,
    updateCombo,
    navigateTo,
    refetchComboDetails,
    setSubmitError,
    setAnnouncement,
  }: {
    mode: ComboDiscountPageMode
    comboId?: string
    comboDetails: ReturnType<typeof useComboQuery>['comboDetails']
    createCombo: ReturnType<typeof useCreateComboAction>['createCombo']
    updateCombo: ReturnType<typeof useUpdateComboAction>['updateCombo']
    navigateTo: NavigateTo
    refetchComboDetails: () => Promise<unknown>
    setSubmitError: Dispatch<SetStateAction<string | null>>
    setAnnouncement: Dispatch<SetStateAction<string>>
  }) =>
  async (values: ComboDiscountFormValues) => {
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

const createStatusHandlers = ({
  comboDetails,
  refetchComboDetails,
  setSubmitError,
  setStatusTarget,
  setAnnouncement,
}: {
  comboDetails: ReturnType<typeof useComboQuery>['comboDetails']
  refetchComboDetails: () => Promise<unknown>
  setSubmitError: Dispatch<SetStateAction<string | null>>
  setStatusTarget: Dispatch<SetStateAction<DiscountStatus | undefined>>
  setAnnouncement: Dispatch<SetStateAction<string>>
}) => ({
  handleRequestStatusChange(status: DiscountStatus) {
    if (!comboDetails || status === comboDetails.combo.status) return
    setSubmitError(null)
    setStatusTarget(status)
  },
  handleStatusOpenChange(open: boolean) {
    if (!open) setStatusTarget(undefined)
  },
  async handleStatusSuccess(message: string) {
    setStatusTarget(undefined)
    setAnnouncement(message)
    await refetchComboDetails()
  },
})

const createDeleteHandlers = ({
  navigateTo,
  setDeleteOpen,
  setSubmitError,
  setAnnouncement,
}: {
  navigateTo: NavigateTo
  setDeleteOpen: Dispatch<SetStateAction<boolean>>
  setSubmitError: Dispatch<SetStateAction<string | null>>
  setAnnouncement: Dispatch<SetStateAction<string>>
}) => ({
  handleRequestDelete() {
    setSubmitError(null)
    setDeleteOpen(true)
  },
  handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open)
  },
  async handleDeleteSuccess() {
    setDeleteOpen(false)
    setAnnouncement('Combo excluído com sucesso.')
    await navigateTo('discounts')
  },
  handleCancel() {
    void navigateTo('discounts')
  },
})

const createComboPageModel = ({
  account,
  announcement,
  query,
  deleteHandlers,
  statusHandlers,
  handleRetry,
  handleSubmit,
  isDeleteOpen,
  isPending,
  statusTarget,
  submitError,
}: {
  account: ReturnType<typeof useAuthContext>['account']
  announcement: string
  query: ReturnType<typeof useComboQuery>
  deleteHandlers: ReturnType<typeof createDeleteHandlers>
  statusHandlers: ReturnType<typeof createStatusHandlers>
  handleRetry: () => void
  handleSubmit: (values: ComboDiscountFormValues) => Promise<void>
  isDeleteOpen: boolean
  isPending: boolean
  statusTarget: DiscountStatus | undefined
  submitError: string | null
}) => ({
  canManageDiscounts: account?.profile === UserProfile.Manager,
  announcement,
  comboDetails: query.comboDetails,
  comboDetailsError: query.comboDetailsError,
  ...deleteHandlers,
  ...statusHandlers,
  handleRetry,
  handleSubmit,
  isComboDetailsError: query.isComboDetailsError,
  isDeleteOpen,
  isLoadingComboDetails: query.isLoadingComboDetails,
  isRefreshingComboDetails: query.isRefreshingComboDetails,
  isPending,
  statusTarget,
  submitError,
})

export function useComboDiscountPage({ comboId, mode }: ComboDiscountPageProps) {
  const { account } = useAuthContext()
  const { navigateTo } = useNavigation()
  const query = useComboQuery(mode === 'edit' ? comboId : undefined)
  const { createCombo, isPending: isCreating } = useCreateComboAction()
  const { isPending: isUpdating, updateCombo } = useUpdateComboAction()
  const [statusTarget, setStatusTarget] = useState<DiscountStatus>()
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const isPending = isCreating || isUpdating
  const submitHandler = createSubmitHandler({
    mode,
    comboId,
    comboDetails: query.comboDetails,
    createCombo,
    updateCombo,
    navigateTo,
    refetchComboDetails: query.refetchComboDetails,
    setSubmitError,
    setAnnouncement,
  })
  const statusHandlers = createStatusHandlers({
    comboDetails: query.comboDetails,
    refetchComboDetails: query.refetchComboDetails,
    setSubmitError,
    setStatusTarget,
    setAnnouncement,
  })
  const deleteHandlers = createDeleteHandlers({
    navigateTo,
    setDeleteOpen,
    setSubmitError,
    setAnnouncement,
  })

  return createComboPageModel({
    account,
    announcement,
    query,
    deleteHandlers,
    statusHandlers,
    handleRetry: () => {
      void query.refetchComboDetails()
    },
    handleSubmit: submitHandler,
    isDeleteOpen,
    isPending,
    statusTarget,
    submitError,
  })
}
