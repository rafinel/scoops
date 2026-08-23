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
  const view = useAccompanimentTypesPage(page, onPageChange)
  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <BackLink onClick={view.handleBack} route='products' />
          <h1 className='text-[28px] font-extrabold tracking-tight'>
            Tipos de acompanhamento
          </h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Organize as opções usadas ao vincular acompanhamentos aos produtos porção.
          </p>
        </div>
        <Button
          className='min-h-10 shadow-primary'
          onClick={() => view.setSelectedAction({ kind: 'create' })}
          type='button'
        >
          <Icon name='plus' /> Novo tipo
        </Button>
      </header>
      {view.isLoading ? (
        <AccompanimentTypesLoading />
      ) : view.isError ? (
        <AccompanimentTypesError onRetry={view.handleRetry} />
      ) : view.data && view.data.items.length > 0 ? (
        <AccompanimentTypesCard
          onEdit={(item) => view.setSelectedAction({ kind: 'edit', item })}
          onPageChange={view.onPageChange}
          onRemove={(item) => view.setSelectedAction({ kind: 'remove', item })}
          page={view.data}
        />
      ) : (
        <AccompanimentTypesEmptyState
          onAdd={() => view.setSelectedAction({ kind: 'create' })}
        />
      )}
      {view.selectedAction?.kind === 'create' || view.selectedAction?.kind === 'edit' ? (
        <AccompanimentTypeDialog
          item={
            view.selectedAction.kind === 'edit' ? view.selectedAction.item : undefined
          }
          onOpenChange={view.handleActionOpenChange}
          onSuccess={view.handleActionSuccess}
          open
        />
      ) : null}
      {view.selectedAction?.kind === 'remove' ? (
        <RemoveAccompanimentTypeDialog
          item={view.selectedAction.item}
          onOpenChange={view.handleActionOpenChange}
          onSuccess={view.handleActionSuccess}
          open
        />
      ) : null}
    </section>
  )
}
