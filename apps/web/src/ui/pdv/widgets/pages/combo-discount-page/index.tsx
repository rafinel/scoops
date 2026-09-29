import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

import { ChangeComboStatusDialog } from './change-combo-status-dialog'
import { ComboDiscountHeader } from './combo-discount-header'
import { ComboDiscountForm } from './combo-discount-form'
import { ComboDiscountLoading } from './combo-discount-loading'
import { DeleteComboDialog } from './delete-combo-dialog'
import { EditLoadError } from './edit-load-error'
import { ReadOnlyComboDetails } from './read-only-combo-details'
import {
  useComboDiscountPage,
  type ComboDiscountPageProps,
} from './use-combo-discount-page'

export type { ComboDiscountPageProps }

export const ComboDiscountPage = (props: ComboDiscountPageProps) => {
  const {
    canManageDiscounts,
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
    isRefreshingComboDetails,
    isPending,
    statusTarget,
    submitError,
  } = useComboDiscountPage(props)
  const formatCurrency = useFormatCurrency()

  if (props.mode === 'edit' && isLoadingComboDetails) {
    return <ComboDiscountLoading />
  }

  if (props.mode === 'edit' && isComboDetailsError) {
    return <EditLoadError error={comboDetailsError} onRetry={handleRetry} />
  }

  if (props.mode === 'edit' && !comboDetails) return null

  return (
    <section className='min-w-0 space-y-5'>
      {canManageDiscounts ? (
        <>
          <ComboDiscountHeader
            announcement={announcement}
            hasDetails={Boolean(comboDetails)}
            isRefreshing={isRefreshingComboDetails}
            mode={props.mode}
            onRequestDelete={handleRequestDelete}
          />
          <ComboDiscountForm
            initialDetails={comboDetails}
            isPending={isPending}
            mode={props.mode}
            onCancel={handleCancel}
            onRequestStatusChange={handleRequestStatusChange}
            onSubmit={handleSubmit}
            submitError={submitError}
          />
        </>
      ) : comboDetails ? (
        <ReadOnlyComboDetails details={comboDetails} formatCurrency={formatCurrency} />
      ) : null}

      {canManageDiscounts && props.mode === 'edit' && comboDetails && statusTarget ? (
        <ChangeComboStatusDialog
          combo={comboDetails.combo}
          expectedUpdatedAt={comboDetails.combo.updatedAt}
          onOpenChange={handleStatusOpenChange}
          onSuccess={handleStatusSuccess}
          open={Boolean(statusTarget)}
          targetStatus={statusTarget}
        />
      ) : null}
      {canManageDiscounts && props.mode === 'edit' && comboDetails ? (
        <DeleteComboDialog
          combo={comboDetails.combo}
          expectedUpdatedAt={comboDetails.combo.updatedAt}
          onOpenChange={handleDeleteOpenChange}
          onSuccess={handleDeleteSuccess}
          open={isDeleteOpen}
        />
      ) : null}
    </section>
  )
}
