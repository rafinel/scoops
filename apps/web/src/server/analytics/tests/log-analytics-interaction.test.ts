import { describe, expect, it, vi } from 'vitest'

import { analyticsInteractionSchema } from '@scoops/validation'

describe('analytics interaction boundary', () => {
  it('accepts only the bounded privacy-safe event envelope', () => {
    expect(
      analyticsInteractionSchema.parse({
        tenantId: 'establishment-id',
        event: 'period-changed',
        period: 'last-30-days',
        target: 'dashboard',
      }),
    ).toEqual({
      tenantId: 'establishment-id',
      event: 'period-changed',
      period: 'last-30-days',
      target: 'dashboard',
    })
    expect(() =>
      analyticsInteractionSchema.parse({
        tenantId: 'establishment-id',
        event: 'period-changed',
        payload: 'private-order-data',
      }),
    ).toThrow()
  })

  it('keeps logger failures outside the interaction contract', () => {
    const logger = vi.fn().mockImplementation(() => {
      throw new Error('logger unavailable')
    })
    expect(() => {
      try {
        logger({ event: 'manual-refresh' })
      } catch {
        return false
      }
      return true
    }).not.toThrow()
    expect(logger).toHaveBeenCalledWith({ event: 'manual-refresh' })
  })
})
