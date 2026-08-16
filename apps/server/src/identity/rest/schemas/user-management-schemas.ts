import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

const email = z.string().trim().toLowerCase().email().max(254)
const name = z.string().trim().min(1).max(120)
const userId = z.string().uuid()

export const userIdSchema = z.object({ userId }).strict()

export const listUsersQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    profile: z.enum([UserProfile.Manager, UserProfile.Operator]).optional(),
    status: z
      .enum([UserStatus.Pending, UserStatus.Active, UserStatus.Inactive])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export const inviteUserSchema = z
  .object({ name, email, profile: z.enum([UserProfile.Manager, UserProfile.Operator]) })
  .strict()

export const correctUserInvitationSchema = inviteUserSchema
export const changeUserProfileSchema = z
  .object({ profile: z.enum([UserProfile.Manager, UserProfile.Operator]) })
  .strict()
export const changeUserStatusSchema = z
  .object({ status: z.enum([UserStatus.Active, UserStatus.Inactive]) })
  .strict()
export const correctUserNameSchema = z.object({ name }).strict()
export const acceptUserInvitationSchema = z
  .object({ confirmationToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
  .strict()
