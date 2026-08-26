import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { BackLink } from '@/ui/shared/widgets/components/back-link'

import { AccompanimentTypeDialog } from './accompaniment-type-dialog'
import { AccompanimentTypesCard } from './accompaniment-types-card'
import { AccompanimentTypesEmptyState } from './accompaniment-types-empty-state'
import { AccompanimentTypesError } from './accompaniment-types-error'
import { AccompanimentTypesLoading } from './accompaniment-types-loading'
import { RemoveAccompanimentTypeDialog } from './remove-accompaniment-type-dialog'
import { useAccompanimentTypesPage } from './use-accompaniment-types-page'

export type AccompanimentTypesPageProps = {
  page: number
  onPageChange: (page: number) => void
}

export const AccompanimentTypesPage = ({
  page,
  onPageChange,
}: AccompanimentTypesPageProps) => {
  const {
    data,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleCreateAction,
    handleEditAction,
    handleRemoveAction,
    handleRetry,
    isError,
    isLoading,
    onPageChange: changePage,
    selectedAction,
  } = useAccompanimentTypesPage(page, onPageChange)
  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <BackLink onClick={handleBack} route='products' />
          <h1 className='text-[28px] font-extrabold tracking-tight'>
            Tipos de acompanhamento
          </h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Organize as opções usadas ao vincular acompanhamentos aos produtos porção.
          </p>
        </div>
        <Button
          className='min-h-10 shadow-primary'
          onClick={handleCreateAction}
          type='button'
        >
          <Icon name='plus' /> Novo tipo
        </Button>
      </header>
      {isLoading ? (
        <AccompanimentTypesLoading />
      ) : isError ? (
        <AccompanimentTypesError onRetry={handleRetry} />
      ) : data && data.items.length > 0 ? (
        <AccompanimentTypesCard
          onEdit={handleEditAction}
          onPageChange={changePage}
          onRemove={handleRemoveAction}
          page={data}
        />
      ) : (
        <AccompanimentTypesEmptyState onAdd={handleCreateAction} />
      )}
      {selectedAction?.kind === 'create' || selectedAction?.kind === 'edit' ? (
        <AccompanimentTypeDialog
          item={selectedAction.kind === 'edit' ? selectedAction.item : undefined}
          onOpenChange={handleActionOpenChange}
          onSuccess={handleActionSuccess}
          open
        />
      ) : null}
      {selectedAction?.kind === 'remove' ? (
        <RemoveAccompanimentTypeDialog
          item={selectedAction.item}
          onOpenChange={handleActionOpenChange}
          onSuccess={handleActionSuccess}
          open
        />
      ) : null}
    </section>
  )
}
