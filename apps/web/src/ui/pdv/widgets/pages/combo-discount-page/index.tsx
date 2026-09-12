import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ChangeComboStatusDialog } from './change-combo-status-dialog'
import { ComboDiscountHeader } from './combo-discount-header'
import { ComboDiscountForm } from './combo-discount-form'
import { ComboDiscountLoading } from './combo-discount-loading'
import { DeleteComboDialog } from './delete-combo-dialog'
import {
  useComboDiscountPage,
  type ComboDiscountPageProps,
} from './use-combo-discount-page'

export type { ComboDiscountPageProps }

export const ComboDiscountPage = (props: ComboDiscountPageProps) => {
  const {
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

  if (props.mode === 'edit' && isLoadingComboDetails) {
    return <ComboDiscountLoading />
  }

  if (props.mode === 'edit' && isComboDetailsError) {
    return (
      <section className='grid min-h-64 place-items-center rounded-2xl border border-border-soft bg-card p-6 text-center'>
        <div>
          <Icon name='triangle-alert' className='mx-auto mb-3 size-8 text-destructive' />
          <h1 className='text-lg font-extrabold'>Não foi possível carregar o combo.</h1>
          <p className='mt-2 max-w-md text-sm text-muted-foreground'>
            {comboDetailsError instanceof Error
              ? comboDetailsError.message
              : 'Tente novamente ou volte para a lista de descontos.'}
          </p>
          <div className='mt-5 flex justify-center gap-2'>
            <Button onClick={handleRetry} variant='outline'>
              Tentar novamente
            </Button>
            <BackLink aria-label='Voltar para descontos' route='discounts'>
              Voltar para descontos
            </BackLink>
          </div>
        </div>
      </section>
    )
  }

  if (props.mode === 'edit' && !comboDetails) return null

  return (
    <section className='min-w-0 space-y-5'>
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

      {props.mode === 'edit' && comboDetails && statusTarget ? (
        <ChangeComboStatusDialog
          combo={comboDetails.combo}
          expectedUpdatedAt={comboDetails.combo.updatedAt}
          onOpenChange={handleStatusOpenChange}
          onSuccess={handleStatusSuccess}
          open={Boolean(statusTarget)}
          targetStatus={statusTarget}
        />
      ) : null}
      {props.mode === 'edit' && comboDetails ? (
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
