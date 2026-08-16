import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { UsersPage } from '@/ui/identity/widgets/pages/users-page'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

const usersSearchSchema = z.object({
  search: z.string().default(''),
  profile: z
    .enum([UserProfile.Manager, UserProfile.Operator])
    .optional()
    .catch(undefined),
  status: z
    .enum([UserStatus.Active, UserStatus.Pending, UserStatus.Inactive])
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: requireManagerMiddleware,
  validateSearch: usersSearchSchema,
  component: UsersPage,
})
