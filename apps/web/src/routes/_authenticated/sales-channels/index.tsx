import { createFileRoute } from '@tanstack/react-router'
import {
  salesChannelsSearchSchema,
  type SalesChannelAdjustmentFilter,
} from '@scoops/validation'

import { SalesChannelsPage } from '@/ui/pdv/widgets/pages/sales-channels-page'

export const Route = createFileRoute('/_authenticated/sales-channels/')({
  validateSearch: salesChannelsSearchSchema,
  component: SalesChannelsRoute,
})

function SalesChannelsRoute() {
  const { adjustment, search } = Route.useSearch()
  const navigate = Route.useNavigate()

  function handleAdjustmentFilterChange(
    nextAdjustment: SalesChannelAdjustmentFilter | undefined,
  ) {
    void navigate({
      search: (previous) => ({ ...previous, adjustment: nextAdjustment }),
    })
  }

  function handleSearchFilterChange(nextSearch: string | undefined) {
    void navigate({ search: (previous) => ({ ...previous, search: nextSearch }) })
  }

  return (
    <SalesChannelsPage
      adjustmentFilter={adjustment}
      onAdjustmentFilterChange={handleAdjustmentFilterChange}
      searchFilter={search}
      onSearchFilterChange={handleSearchFilterChange}
    />
  )
}
