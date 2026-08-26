import { createFileRoute } from '@tanstack/react-router'
import {
  salesChannelsSearchSchema,
  type SalesChannelAdjustmentFilter,
} from '@scoops/validation'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { SalesChannelsPage } from '@/ui/pdv/widgets/pages/sales-channels-page'

export const Route = createFileRoute('/_authenticated/sales-channels/')({
  beforeLoad: requireManagerMiddleware,
  validateSearch: salesChannelsSearchSchema,
  component: SalesChannelsRoute,
})

function SalesChannelsRoute() {
  const { adjustment } = Route.useSearch()
  const navigate = Route.useNavigate()

  function handleAdjustmentFilterChange(
    nextAdjustment: SalesChannelAdjustmentFilter | undefined,
  ) {
    void navigate({
      search: (previous) => ({ ...previous, adjustment: nextAdjustment }),
    })
  }

  return (
    <SalesChannelsPage
      adjustmentFilter={adjustment}
      onAdjustmentFilterChange={handleAdjustmentFilterChange}
    />
  )
}
