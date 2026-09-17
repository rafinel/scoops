import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/ui/analytics/widgets/pages/dashboard-page'

export const Route = createFileRoute('/_authenticated/')({ component: DashboardPage })
