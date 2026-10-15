import type { ProductAccompanimentDialogState } from '../../use-product-accompaniment-dialog'

export type TypeFeedbackProps = {
  state: ProductAccompanimentDialogState
}

export const TypeFeedback = ({ state }: TypeFeedbackProps) => (
  <>
    {state.typesLoading ? (
      <span className='text-xs text-muted-foreground'>Carregando tipos…</span>
    ) : null}
    {state.typesError ? (
      <span className='text-sm font-semibold text-destructive'>
        Não foi possível carregar os tipos.
      </span>
    ) : null}
    {state.errors.accompanimentTypeId ? (
      <span className='text-sm font-semibold text-destructive'>
        {state.errors.accompanimentTypeId.message}
      </span>
    ) : null}
  </>
)
