import {
  RegistrationAttemptStatus,
  RegistrationAttemptType,
} from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const sendInvitationEmailEventSchema = z.object({
  registrationAttemptId: z.string(),
  establishmentId: z.string(),
  type: z.enum(RegistrationAttemptType),
  status: z.enum(RegistrationAttemptStatus),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
})
