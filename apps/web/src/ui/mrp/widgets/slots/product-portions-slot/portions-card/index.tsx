import type {
  AccompanimentPortionDetails,
  AccompanimentPortionsPage,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { Card } from '@/ui/shadcn/card'

import { PortionsCardBody } from './portions-card-body'
import { PortionsCardHeader } from './portions-card-header'
import { PortionsInactiveNotice } from './portions-inactive-notice'
import { PortionsSearch } from './portions-search'
import { usePortionsCard } from './use-portions-card'

export type PortionsCardProps = {
  canManage: boolean
  globalAccompaniment: GlobalAccompanimentDetails
  handleEditGlobalAction: () => void
  handleEditRowAction: (item: AccompanimentPortionDetails) => void
  handleLinkAction: () => void
  handleMakeGlobalAction: () => void
  handleMakeIndividualAction: () => void
  handlePageChange: (page: number) => void
  handleRemoveGlobalAction: () => void
  handleRemoveRowAction: (item: AccompanimentPortionDetails) => void
  handleSearchChange: (search: string) => void
  isActive: boolean
  isPageLoading: boolean
  isSearching: boolean
  linkedCount: number
  portionsPage: AccompanimentPortionsPage
  searchInput: string
}

export const PortionsCard = (props: PortionsCardProps) => {
  const { inactiveNoticeId, searchInputRef, showsInactiveNotice, showsSearch, ...state } =
    usePortionsCard(props)
  const shared = { ...props, ...state, inactiveNoticeId }

  return (
    <Card className='min-w-0 gap-4 overflow-hidden rounded-2xl p-4 shadow-card sm:p-6'>
      <PortionsCardHeader {...shared} />
      {showsInactiveNotice ? <PortionsInactiveNotice id={inactiveNoticeId} /> : null}
      {showsSearch ? (
        <PortionsSearch
          inputRef={searchInputRef}
          onChange={props.handleSearchChange}
          value={props.searchInput}
        />
      ) : null}
      <PortionsCardBody {...shared} />
    </Card>
  )
}
