import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

export type PaginationProps = {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  itemLabel?: string
  className?: string
}

export const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel,
  className,
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const visiblePageCount = Math.min(5, totalPages)
  const firstVisiblePage = Math.min(
    Math.max(1, safeCurrentPage - 2),
    totalPages - visiblePageCount + 1,
  )
  const visiblePages = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index,
  )
  const firstItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const lastItem = Math.min(safeCurrentPage * pageSize, totalItems)
  const summary = `Mostrando ${firstItem}-${lastItem} de ${totalItems}${itemLabel ? ` ${itemLabel}` : ''}`

  if (totalItems === 0 || totalPages === 1) return null

  return (
    <nav
      aria-label='Paginação'
      className={cn(
        'flex items-center justify-between gap-4 overflow-x-auto border-t border-border-soft bg-card px-5 py-4 sm:px-6',
        className,
      )}
    >
      <span
        aria-live='polite'
        className='shrink-0 text-sm font-normal text-muted-foreground'
      >
        {summary}
      </span>
      <div className='flex shrink-0 items-center gap-1.5'>
        <Button
          aria-label='Página anterior'
          className='size-12 rounded-[10px] bg-card p-0 text-foreground hover:bg-muted disabled:opacity-50'
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          size='icon'
          type='button'
          variant='outline'
        >
          <Icon name='chevron-left' className='size-5' />
        </Button>
        {visiblePages.map((page) => (
          <Button
            aria-current={page === safeCurrentPage ? 'page' : undefined}
            aria-label={`Página ${page}`}
            className={cn(
              'size-12 rounded-[10px] p-0 text-base font-medium',
              page === safeCurrentPage
                ? 'bg-primary font-bold text-primary-foreground shadow-primary hover:bg-primary/90'
                : 'bg-card text-foreground hover:bg-muted',
            )}
            key={page}
            onClick={() => onPageChange(page)}
            size='icon'
            type='button'
            variant={page === safeCurrentPage ? 'default' : 'outline'}
          >
            {page}
          </Button>
        ))}
        <Button
          aria-label='Próxima página'
          className='size-12 rounded-[10px] bg-card p-0 text-foreground hover:bg-muted disabled:opacity-50'
          disabled={safeCurrentPage === totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          size='icon'
          type='button'
          variant='outline'
        >
          <Icon name='chevron-right' className='size-5' />
        </Button>
      </div>
    </nav>
  )
}
