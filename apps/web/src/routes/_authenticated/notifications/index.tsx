import { createFileRoute } from '@tanstack/react-router'
import { notificationsSearchSchema } from '@scoops/validation'

import { NotificationsPage } from '@/ui/communication/widgets/pages/notifications-page'

export const Route = createFileRoute('/_authenticated/notifications/')({
  validateSearch: notificationsSearchSchema,
  component: NotificationsPage,
})
