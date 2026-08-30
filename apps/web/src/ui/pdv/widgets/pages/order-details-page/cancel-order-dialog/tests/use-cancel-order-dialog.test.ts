import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCancelOrderAction } from '@/ui/pdv/hooks/use-cancel-order-action'

import { useCancelOrderDialog } from '../use-cancel-order-dialog'

vi.mock('@/ui/pdv/hooks/use-cancel-order-action', () => ({
  useCancelOrderAction: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useCancelOrderActionMock = vi.mocked(useCancelOrderAction)

const order = {
  id: 'order-1',
  sequenceNumber: 124,
  createdAt: new Date('2026-07-24T15:42:00.000Z'),
  total: 42.56,
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

  it('submits the normalized optional reason and closes after success', async () => {
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
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as never)
    })
    expect(
      useCancelOrderActionMock.mock.results[0]?.value.cancelOrder,
    ).toHaveBeenCalledWith({
      orderId: 'order-1',
      reason: 'pedido duplicado',
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
