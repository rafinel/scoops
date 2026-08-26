import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ChangeComboStatusDialog } from './change-combo-status-dialog'
import { ComboDiscountForm } from './combo-discount-form'
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
    isPending,
    statusTarget,
    submitError,
  } = useComboDiscountPage(props)

  if (props.mode === 'edit' && isLoadingComboDetails) {
    return (
      <div
        aria-label='Carregando combo'
        role='status'
        className='grid min-h-64 place-items-center rounded-2xl border border-border-soft bg-card text-sm text-muted-foreground'
      >
        Carregando combo…
      </div>
    )
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
            <Button onClick={handleCancel}>Voltar para descontos</Button>
          </div>
        </div>
      </section>
    )
  }

  if (props.mode === 'edit' && !comboDetails) return null

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <Button
            className='-ml-2 mb-3'
            onClick={handleCancel}
            size='sm'
            type='button'
            variant='ghost'
          >
            <Icon name='arrow-left' /> Voltar para descontos
          </Button>
          <h1 className='mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl'>
            {props.mode === 'create' ? 'Adicionar desconto' : 'Editar desconto'}
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            {props.mode === 'create'
              ? 'Configure os produtos e o preço especial do Combo.'
              : 'Atualize a composição, o preço e o status do Combo.'}
          </p>
        </div>
        {props.mode === 'edit' && comboDetails ? (
          <div className='flex flex-wrap gap-2'>
            <Button onClick={handleRequestDelete} type='button' variant='destructive'>
              <Icon name='trash-2' /> Excluir
            </Button>
          </div>
        ) : null}
      </header>

      <div aria-live='polite' className='sr-only'>
        {announcement}
      </div>
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
