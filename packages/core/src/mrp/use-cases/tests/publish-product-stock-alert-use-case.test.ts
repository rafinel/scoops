import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'

import { ProductFaker } from '#mrp/domain/entities/fakers/product-faker.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import { ProductStockAlertState } from '#mrp/domain/structures/product-stock-alert-state.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { PublishProductStockAlertUseCase } from '#mrp/use-cases/publish-product-stock-alert-use-case.ts'

const occurredAt = new Date('2026-01-01T00:00:00.000Z')

describe('Publish Product Stock Alert Use Case', () => {
  it.each([
    { previousQuantity: 10, availableQuantity: 4, emits: true },
    { previousQuantity: 10, availableQuantity: 0, emits: true },
    { previousQuantity: 4, availableQuantity: 0, emits: true },
    { previousQuantity: 0, availableQuantity: 4, emits: false },
    { previousQuantity: 0, availableQuantity: 10, emits: false },
    { previousQuantity: 4, availableQuantity: 10, emits: false },
    { previousQuantity: 4, availableQuantity: 3, emits: false },
  ])('applies the downward transition table: %s', async (input) => {
    const broker = mock<Broker>()
    const useCase = new PublishProductStockAlertUseCase(broker)
    const product = ProductFaker.fake({ idealStock: 10 })

    await useCase.execute({ product, occurredAt, ...input })

    if (input.emits) {
      expect(broker.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: ProductStockAlertStateEnteredEvent._NAME,
          payload: expect.objectContaining({
            state:
              input.availableQuantity <= 0
                ? ProductStockAlertState.Zero
                : ProductStockAlertState.BelowIdeal,
            availableQuantity: input.availableQuantity,
            idealQuantity: 10,
            occurredAt,
          }),
        }),
      )
    } else {
      expect(broker.publish).not.toHaveBeenCalled()
    }
  })

  it('emits on alerting product creation and rejects impossible quantities', async () => {
    const broker = mock<Broker>()
    const useCase = new PublishProductStockAlertUseCase(broker)
    const product = ProductFaker.fake({ idealStock: 10 })

    await useCase.execute({ product, availableQuantity: 0, occurredAt })
    expect(broker.publish).toHaveBeenCalledTimes(1)
    await expect(
      useCase.execute({ product, availableQuantity: Number.NaN, occurredAt }),
    ).rejects.toThrow()
  })
})
