export type TypeFeedbackProps = {
  typeError?: string
  typesError: boolean
  typesLoading: boolean
}

export const TypeFeedback = ({
  typeError,
  typesError,
  typesLoading,
}: TypeFeedbackProps) => (
  <>
    {typesLoading ? (
      <span className='text-xs text-muted-foreground'>Carregando tipos…</span>
    ) : null}
    {typesError ? (
      <span className='text-sm font-semibold text-destructive'>
        Não foi possível carregar os tipos.
      </span>
    ) : null}
    {typeError ? (
      <span className='text-sm font-semibold text-destructive'>{typeError}</span>
    ) : null}
  </>
)
