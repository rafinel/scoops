import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { OrderDetailsHeaderProps } from '..'
import { useOrderDetailsHeader } from '../use-order-details-header'

describe('useOrderDetailsHeader', () => {
  afterEach(cleanup)
  it('preserves five-digit identity, saved timestamps, status and callback delegation', () => {
    const props: OrderDetailsHeaderProps = {
      canCancel: true,
      createdAt: new Date('2026-09-29T12:00:00Z'),
      isRefreshing: false,
      onBack: vi.fn(),
      onOpenCancel: vi.fn(),
      sequenceNumber: 124,
      status: 'registered',
      printAction: null,
    }
    const { result, rerender } = renderHook((current) => useOrderDetailsHeader(current), {
      initialProps: props,
    })
    expect(result.current.sequence).toBe('00124')
    expect(result.current.isCanceled).toBe(false)
    expect(result.current.timestamp).toContain('29/09/2026')
    act(() => {
      result.current.handleBack()
      result.current.handleOpenCancel()
    })
    expect(props.onBack).toHaveBeenCalledOnce()
    expect(props.onOpenCancel).toHaveBeenCalledOnce()
    rerender({
      ...props,
      status: 'canceled',
      canceledAt: new Date('2026-09-30T16:08:00Z'),
    })
    expect(result.current.isCanceled).toBe(true)
    expect(result.current.timestamp).toContain('30/09/2026')
    rerender({ ...props, status: 'canceled' })
    expect(result.current.timestamp).toContain('29/09/2026')
  })
})
