import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCancelOrderAction } from '@/ui/pdv/hooks/use-cancel-order-action'

import { useCancelOrderDialog } from '../use-cancel-order-dialog'

vi.mock('@/ui/pdv/hooks/use-cancel-order-action', () => ({
  useCancelOrderAction: vi.fn(),
}))
const useCancelOrderActionMock = vi.mocked(useCancelOrderAction)

const order = {
  id: 'order-1',
  sequenceNumber: 124,
  createdAt: new Date('2026-07-24T15:42:00.000Z'),
  total: 42.56,
  lines: [{}, {}],
} as never

describe('useCancelOrderDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCancelOrderActionMock.mockReturnValue({
      cancelOrder: vi.fn().mockResolvedValue(undefined),
      cancelOrderError: null,
      isCancelingOrder: false,
    })
  })

  it('submits one disposition for every line and closes after success', async () => {
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useCancelOrderDialog({ onOpenChange, onSuccess, open: true, order }),
    )
    await act(async () => {
      await result.current.register('reason').onChange({
        target: { name: 'reason', value: '  pedido duplicado  ' },
        type: 'change',
      })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(
      useCancelOrderActionMock.mock.results[0]?.value.cancelOrder,
    ).toHaveBeenCalledWith({
      orderId: 'order-1',
      reason: 'pedido duplicado',
      lineDispositions: [
        { linePosition: 0, disposition: 'return' },
        { linePosition: 1, disposition: 'return' },
      ],
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps the line choices after an error so the manager can retry', async () => {
    const cancelOrder = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValueOnce(undefined)
    useCancelOrderActionMock.mockReturnValue({
      cancelOrder,
      cancelOrderError: null,
      isCancelingOrder: false,
    })
    const { result } = renderHook(() =>
      useCancelOrderDialog({
        onOpenChange: vi.fn(),
        onSuccess: vi.fn(),
        open: true,
        order,
      }),
    )

    await act(async () => {
      await result.current.register('lineDispositions.0.disposition').onChange({
        target: { name: 'lineDispositions.0.disposition', value: 'loss' },
        type: 'change',
      })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(cancelOrder).toHaveBeenNthCalledWith(1, {
      orderId: 'order-1',
      reason: undefined,
      lineDispositions: [
        { linePosition: 0, disposition: 'loss' },
        { linePosition: 1, disposition: 'return' },
      ],
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(cancelOrder).toHaveBeenNthCalledWith(2, {
      orderId: 'order-1',
      reason: undefined,
      lineDispositions: [
        { linePosition: 0, disposition: 'loss' },
        { linePosition: 1, disposition: 'return' },
      ],
    })
  })
})
