import type {
  AccompanimentPortionDetails,
  AccompanimentPortionsPage,
} from '@scoops/core/mrp/domain/structures'

import { Pagination } from '@/ui/shared/widgets/components/pagination'

import { PortionsEmptyState } from '../../portions-empty-state'
import { PortionsTable } from '../../portions-table'
import { PORTIONS_PAGE_SIZE } from '../../use-portions-list-state'
import type { PortionsCardBody as PortionsCardBodyKind } from '../use-portions-card'

export type PortionsCardBodyProps = {
  body: PortionsCardBodyKind
  canManage: boolean
  handleClearSearch: () => void
  handleEditRowAction: (item: AccompanimentPortionDetails) => void
  handleLinkAction: () => void
  handlePageChange: (page: number) => void
  handleRemoveRowAction: (item: AccompanimentPortionDetails) => void
  inactiveNoticeId: string
  isActive: boolean
  isPageLoading: boolean
  portionsPage: AccompanimentPortionsPage
  searchInput: string
}

export const PortionsCardBody = (props: PortionsCardBodyProps) =>
  props.body === 'table' ? (
    <>
      <PortionsTable
        canManage={props.canManage}
        inactiveNoticeId={props.inactiveNoticeId}
        isActive={props.isActive}
        items={props.portionsPage.items}
        onEdit={props.handleEditRowAction}
        onRemove={props.handleRemoveRowAction}
      />
      <Pagination
        className='flex-col items-start gap-3 border-t-0 bg-transparent p-0 sm:flex-row sm:items-center'
        currentPage={props.portionsPage.page}
        isLoading={props.isPageLoading}
        itemLabel='porções'
        onPageChange={props.handlePageChange}
        pageSize={PORTIONS_PAGE_SIZE}
        totalItems={props.portionsPage.total}
      />
    </>
  ) : (
    <PortionsEmptyState
      canManage={props.canManage}
      inactiveNoticeId={props.inactiveNoticeId}
      isActive={props.isActive}
      onClearSearch={props.handleClearSearch}
      onLink={props.handleLinkAction}
      search={props.searchInput.trim()}
      variant={props.body}
    />
  )
