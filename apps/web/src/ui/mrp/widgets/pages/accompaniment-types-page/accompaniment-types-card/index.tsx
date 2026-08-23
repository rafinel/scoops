import type {
  AccompanimentTypeListItem,
  AccompanimentTypePage,
} from '@scoops/core/mrp/domain/structures'

import { Pagination } from '@/ui/shared/widgets/components/pagination'
import { AccompanimentTypesTable } from '../accompaniment-types-table'

export type AccompanimentTypesCardProps = {
  page: AccompanimentTypePage
  onEdit: (item: AccompanimentTypeListItem) => void
  onPageChange: (page: number) => void
  onRemove: (item: AccompanimentTypeListItem) => void
}

export const AccompanimentTypesCard = ({
  page,
  onEdit,
  onPageChange,
  onRemove,
}: AccompanimentTypesCardProps) => (
  <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
    <div className='border-b border-border-soft px-5 py-5'>
      <p className='text-lg font-extrabold'>
        Tipos cadastrados{' '}
        <span className='text-sm font-semibold text-muted-foreground'>{page.total}</span>
      </p>
      <div className='mt-4 flex items-center gap-1 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning-foreground'>
        <span aria-hidden='true'>🔒</span> Tipos em uso só podem ser removidos após
        resolver seus vínculos.
      </div>
    </div>
    <AccompanimentTypesTable items={page.items} onEdit={onEdit} onRemove={onRemove} />
    <Pagination
      currentPage={page.page}
      pageSize={page.pageSize}
      onPageChange={onPageChange}
      totalItems={page.total}
      itemLabel='tipos'
    />
  </section>
)
