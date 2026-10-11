import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/ui/analytics/widgets/pages/dashboard-page'
import { requireDashboardOrRedirectOperatorMiddleware } from '@/middlewares/require-dashboard-or-redirect-operator-middleware'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  beforeLoad: requireDashboardOrRedirectOperatorMiddleware,
  component: DashboardPage,
})
