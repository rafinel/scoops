import { createFileRoute } from '@tanstack/react-router'
import { usersSearchSchema } from '@scoops/validation'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { UsersPage } from '@/ui/identity/widgets/pages/users-page'

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: requireManagerMiddleware,
  validateSearch: usersSearchSchema,
  component: UsersPage,
})
