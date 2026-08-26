export type RecoveryActionsProps = {
  error?: string
  onRetry: () => void
  onRevert: () => void
}

export const RecoveryActions = ({ error, onRetry, onRevert }: RecoveryActionsProps) => {
  if (!error) return null

  return (
    <div className='mt-2 flex flex-wrap gap-2'>
      <button
        className='text-xs font-bold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        onClick={onRetry}
        type='button'
      >
        Tentar novamente
      </button>
      <button
        className='text-xs font-bold text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        onClick={onRevert}
        type='button'
      >
        Reverter
      </button>
    </div>
  )
}
