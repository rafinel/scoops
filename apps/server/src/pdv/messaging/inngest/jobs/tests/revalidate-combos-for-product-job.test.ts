import type { ProductSalesConfiguration } from '@scoops/core/mrp/domain/structures'
import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { DiscountsRepository, PdvDatabase } from '@scoops/core/pdv/interfaces'
import { productSalesConfigurationChangedEventSchema } from '@scoops/validation'
import type { InngestFunction } from 'inngest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  productSalesConfigurationChangedEvent,
  RevalidateCombosForProductJob,
} from '@/pdv/messaging/inngest/jobs'
import type { InngestClient } from '@/shared/messaging/inngest/inngest-client'

type EventData = z.infer<typeof productSalesConfigurationChangedEventSchema>
type JobHandler = (input: {
  event: { data: EventData }
  step: { run<T>(id: string, operation: () => Promise<T>): Promise<T> }
}) => Promise<unknown>

function configuration(
  overrides: Partial<ProductSalesConfiguration> = {},
): ProductSalesConfiguration {
  return {
    establishmentId: '43000000-0000-4000-8000-000000000001',
    productId: '51000000-0000-4000-8000-000000000001',
    name: 'Resale Product',
    categories: ['resale'],
    status: 'active',
    stockControl: 'single',
    sizes: [],
    resaleConfigurations: [{ price: 20, isActive: true }],
    updatedAt: new Date('2026-08-26T12:00:00.000Z'),
    ...overrides,
  }
}

describe('Revalidate Combos For Product Job', () => {
  let handler: JobHandler
  let createFunction: ReturnType<typeof vi.fn>
  let discountsRepository: DiscountsRepository

  beforeEach(() => {
    const combo: Combo = {
      id: '52000000-0000-4000-8000-000000000001',
      establishmentId: '43000000-0000-4000-8000-000000000001',
      name: 'Combo',
      type: 'combo',
      status: 'active',
      fixedPrice: 30,
      components: [
        {
          kind: 'resale',
          productId: '51000000-0000-4000-8000-000000000001',
          quantity: 1,
        },
        {
          kind: 'resale',
          productId: '51000000-0000-4000-8000-000000000002',
          quantity: 1,
        },
      ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    discountsRepository = {
      findManyByProductId: vi.fn().mockResolvedValue([combo]),
      setStatus: vi.fn().mockResolvedValue({ ...combo, status: 'inactive' }),
    } as unknown as DiscountsRepository
    const database = {
      run: vi.fn((operation) => operation({ discountsRepository })),
    } as unknown as PdvDatabase
    createFunction = vi.fn((_options: unknown, callback: JobHandler) => {
      handler = callback
      return {} as InngestFunction.Like
    })
    const inngest = { createFunction } as unknown as InngestClient

    new RevalidateCombosForProductJob(inngest, database)
  })

  it('registers the validated event, stable step, and tenant/product concurrency key', async () => {
    expect(productSalesConfigurationChangedEvent.name).toBe(
      'mrp/product.sales-configuration-changed',
    )
    expect(createFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pdv/revalidate-combos-for-product',
        concurrency: {
          limit: 1,
          key: 'event.data.establishmentId + ":" + event.data.productId',
        },
        triggers: [productSalesConfigurationChangedEvent],
      }),
      expect.any(Function),
    )

    const malformed = productSalesConfigurationChangedEventSchema.safeParse({
      establishmentId: 'not-a-uuid',
      productId: '51000000-0000-4000-8000-000000000001',
      state: 'deleted',
      configuration: null,
    })
    expect(malformed.success).toBe(false)
  })

  it('passes serialized available facts through the Core revalidation action', async () => {
    const stepRun = vi.fn(async <T>(_id: string, operation: () => Promise<T>) =>
      operation(),
    )
    const payload = configuration()
    await handler({
      event: {
        data: {
          establishmentId: payload.establishmentId,
          productId: payload.productId,
          state: 'available',
          configuration: { ...payload, updatedAt: payload.updatedAt.toISOString() },
        },
      },
      step: { run: stepRun },
    })

    expect(stepRun).toHaveBeenCalledWith('revalidate-combos', expect.any(Function))
    expect(discountsRepository.setStatus).not.toHaveBeenCalled()
  })

  it('inactivates invalid and deleted references safely when a retried step repeats', async () => {
    const stepRun = vi.fn(async <T>(_id: string, operation: () => Promise<T>) =>
      operation(),
    )
    const deleted: EventData = {
      establishmentId: '43000000-0000-4000-8000-000000000001',
      productId: '51000000-0000-4000-8000-000000000001',
      state: 'deleted',
      configuration: null,
    }
    await handler({ event: { data: deleted }, step: { run: stepRun } })
    await handler({ event: { data: deleted }, step: { run: stepRun } })

    expect(discountsRepository.setStatus).toHaveBeenCalledTimes(2)
    expect(stepRun).toHaveBeenCalledTimes(2)
  })
})
