import { z } from 'zod'

const continuationToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/)
const email = z.string().trim().toLowerCase().email().max(254)
const password = z.string().min(8).max(64)

export const registerIceCreamShopOnboardingSchema = z
  .object({
    establishmentName: z.string().trim().min(1).max(120),
    managerName: z.string().trim().min(1).max(120),
    email,
    password,
  })
  .strict()

export const onboardingTokenSchema = z.object({ continuationToken }).strict()

export const correctOnboardingEmailSchema = z
  .object({ continuationToken, email, password })
  .strict()

export const confirmOnboardingSchema = z
  .object({ confirmationToken: continuationToken })
  .strict()
