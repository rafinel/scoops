import {
  OutboxEventValidationError,
  validateOutboxEvent,
} from '@/shared/messaging/outbox/event-validation'
import { describe, expect, it } from 'vitest'

const ids = {
  establishmentId: '55000000-0000-4000-8000-000000000001',
  userId: '55000000-0000-4000-8000-000000000002',
  actorUserId: '55000000-0000-4000-8000-000000000003',
  productId: '55000000-0000-4000-8000-000000000004',
}
const timestamp = '2026-09-05T12:00:00.000Z'

describe('outbox notification event validation', () => {
  it('accepts all five complete notification source payloads', () => {
    const events = [
      [
        'mrp/product.stock-alert-state-entered',
        {
          establishmentId: ids.establishmentId,
          productId: ids.productId,
          productName: 'Chocolate',
          unit: 'kg',
          state: 'below-ideal',
          availableQuantity: 2,
          idealQuantity: 10,
          occurredAt: timestamp,
        },
      ],
      [
        'identity/user.invitation-accepted',
        {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          email: 'operator@example.com',
          userName: 'Ana Operator',
          profile: 'operator',
          occurredAt: timestamp,
        },
      ],
      [
        'identity/user.profile-updated',
        {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'operator@example.com',
          userName: 'Ana Operator',
          previousProfile: 'operator',
          profile: 'manager',
          updatedAt: timestamp,
        },
      ],
      [
        'identity/user.inactivated',
        {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'operator@example.com',
          userName: 'Ana Operator',
          previousStatus: 'active',
          status: 'inactive',
          updatedAt: timestamp,
        },
      ],
      [
        'identity/user.reactivated',
        {
          establishmentId: ids.establishmentId,
          userId: ids.userId,
          actorUserId: ids.actorUserId,
          email: 'operator@example.com',
          userName: 'Ana Operator',
          previousStatus: 'inactive',
          profile: 'operator',
          status: 'active',
          updatedAt: timestamp,
        },
      ],
    ] as const

    for (const [name, payload] of events)
      expect(() => validateOutboxEvent(name, payload)).not.toThrow()
  })

  it('rejects incomplete and unknown event payloads', () => {
    expect(() =>
      validateOutboxEvent('mrp/product.stock-alert-state-entered', {
        establishmentId: ids.establishmentId,
        productId: ids.productId,
        productName: 'Chocolate',
      }),
    ).toThrow(OutboxEventValidationError)
    expect(() => validateOutboxEvent('communication/unknown', {})).toThrow(
      OutboxEventValidationError,
    )
    expect(() => validateOutboxEvent('identity/user.inactivated', null)).toThrow(
      OutboxEventValidationError,
    )
  })

  it('validates Date payloads after JSON serialization', () => {
    expect(() =>
      validateOutboxEvent('mrp/product.stock-alert-state-entered', {
        establishmentId: ids.establishmentId,
        productId: ids.productId,
        productName: 'Chocolate',
        unit: 'kg',
        state: 'below-ideal',
        availableQuantity: 2,
        idealQuantity: 10,
        occurredAt: new Date(timestamp),
      }),
    ).not.toThrow()

    expect(() =>
      validateOutboxEvent('mrp/product.stock-alert-state-entered', {
        establishmentId: ids.establishmentId,
        productId: ids.productId,
        productName: 'Chocolate',
        unit: 'kg',
        state: 'below-ideal',
        availableQuantity: 2,
        idealQuantity: 10,
        occurredAt: new Date('invalid'),
      }),
    ).toThrow(OutboxEventValidationError)
  })

  it('rejects non-serializable payloads and serialized non-objects', () => {
    const circularPayload: Record<string, unknown> = {
      establishmentId: ids.establishmentId,
    }
    circularPayload.self = circularPayload

    expect(() =>
      validateOutboxEvent('mrp/product.stock-alert-state-entered', circularPayload),
    ).toThrow(OutboxEventValidationError)
    expect(() =>
      validateOutboxEvent('mrp/product.stock-alert-state-entered', new Date(timestamp)),
    ).toThrow(OutboxEventValidationError)
  })
})
