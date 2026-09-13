export type QueryRefreshStatusProps = {
  isRefreshing: boolean
  label?: string
}

export const QueryRefreshStatus = ({
  isRefreshing,
  label = 'Atualizando…',
}: QueryRefreshStatusProps) => {
  if (!isRefreshing) return null

  return (
    <span
      aria-label={label}
      aria-live='polite'
      className='text-xs font-semibold text-muted-foreground'
      role='status'
    >
      {label}
    </span>
  )
}
