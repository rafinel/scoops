import {
  onboardingConfirmationPreparedEventSchema,
  passwordRecoveryPreparedEventSchema,
  productSalesConfigurationChangedEventSchema,
  userInvitationPreparedEventSchema,
} from '@scoops/validation'
import { z } from 'zod'

const typedEventSchemas = {
  'identity/onboarding-confirmation.prepared': onboardingConfirmationPreparedEventSchema,
  'identity/password-recovery.prepared': passwordRecoveryPreparedEventSchema,
  'identity/user-invitation.prepared': userInvitationPreparedEventSchema,
  'mrp/product.sales-configuration-changed': productSalesConfigurationChangedEventSchema,
} as const

const knownEventNames = new Set([
  ...Object.keys(typedEventSchemas),
  'billing/charge.failed',
  'billing/charge.paid',
  'billing/subscription.activated',
  'billing/subscription.blocked',
  'billing/subscription.cancellation-scheduled',
  'billing/subscription.reactivated',
  'billing/trial.started',
  'identity/establishment.activated',
  'identity/establishment.created',
  'identity/establishment.deleted',
  'identity/establishment.updated',
  'identity/user-registration-attempt.cancelled',
  'identity/user-registration-attempt.confirmed',
  'identity/user-registration-attempt.created',
  'identity/user-registration-attempt.expired',
  'identity/user-registration-attempt.updated',
  'identity/user.activated',
  'identity/user.created',
  'identity/user.inactivated',
  'identity/user.invitation-accepted',
  'identity/user.invitation-cancelled',
  'identity/user.invitation-resent',
  'identity/user.invited',
  'identity/user.profile-updated',
  'identity/user.reactivated',
  'identity/user.updated',
  'mrp/product.created',
  'mrp/product.updated',
  'mrp/stock.adjusted',
  'pdv/discount.created',
  'pdv/discount.deleted',
  'pdv/discount.updated',
  'pdv/order.registered',
  'pdv/sales-channel.created',
  'pdv/sales-channel.updated',
])

export class OutboxEventValidationError extends Error {
  constructor() {
    super('Invalid outbox event')
    this.name = 'OutboxEventValidationError'
  }
}

export function validateOutboxEvent(eventName: string, payload: unknown): void {
  if (!knownEventNames.has(eventName.trim())) throw new OutboxEventValidationError()
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new OutboxEventValidationError()
  }

  const schema = typedEventSchemas[eventName as keyof typeof typedEventSchemas]
  if (schema && !schema.safeParse(payload).success) {
    throw new OutboxEventValidationError()
  }

  try {
    z.record(z.string(), z.unknown()).parse(payload)
    JSON.stringify(payload)
  } catch {
    throw new OutboxEventValidationError()
  }
}
