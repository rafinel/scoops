import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNavigate } from '@tanstack/react-router'

import type {
  GlobalSearchHit,
  GlobalSearchResults,
} from '@scoops/core/identity/domain/structures'

import { useGlobalSearchQuery } from '@/ui/identity/hooks/use-global-search-query'
import { useGlobalSearch } from '../use-global-search'

vi.mock('@tanstack/react-router', () => ({ useNavigate: vi.fn() }))
vi.mock('@/ui/identity/hooks/use-global-search-query', () => ({
  useGlobalSearchQuery: vi.fn(),
}))

const useNavigateMock = vi.mocked(useNavigate)
const useGlobalSearchQueryMock = vi.mocked(useGlobalSearchQuery)
const navigateMock = vi.fn()

const order = {
  kind: 'order',
  orderId: 'order-1',
  label: '#1042',
  context: 'Ana Silva',
  status: 'registered',
} as const
const results: GlobalSearchResults = {
  pages: [],
  products: [],
  orders: [order],
  users: [],
  salesChannels: [],
  discounts: [],
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useNavigateMock.mockReturnValue(navigateMock as never)
    useGlobalSearchQueryMock.mockReturnValue({
      data: results,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('debounces trimmed input and avoids querying blank or overlong values', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.handleChange('  orders  '))
    expect(useGlobalSearchQueryMock).toHaveBeenLastCalledWith('')
    act(() => vi.advanceTimersByTime(249))
    expect(useGlobalSearchQueryMock).toHaveBeenLastCalledWith('')
    act(() => vi.advanceTimersByTime(1))
    expect(useGlobalSearchQueryMock).toHaveBeenLastCalledWith('orders')
    act(() => result.current.handleChange('   '))
    act(() => vi.advanceTimersByTime(250))
    expect(useGlobalSearchQueryMock).toHaveBeenLastCalledWith('')
    act(() => result.current.handleChange('x'.repeat(101)))
    expect(result.current.isOpen).toBe(false)
  })

  it('uses arrows, Enter, Escape and Tab with focus return and canonical navigation', () => {
    const { result } = renderHook(() => useGlobalSearch())
    act(() => result.current.handleChange('pedido'))
    act(() => vi.advanceTimersByTime(250))
    const input = document.createElement('input')
    const focusMock = vi.spyOn(input, 'focus')
    Object.defineProperty(result.current.inputRef, 'current', { value: input })

    act(() =>
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as never),
    )
    expect(result.current.activeIndex).toBe(0)
    act(() =>
      result.current.handleKeyDown({ key: 'Enter', preventDefault: vi.fn() } as never),
    )
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/orders/order-1' }),
    )
    expect(result.current.isOpen).toBe(false)

    act(() => result.current.handleChange('pedido'))
    act(() => vi.advanceTimersByTime(250))
    act(() =>
      result.current.handleKeyDown({ key: 'Escape', preventDefault: vi.fn() } as never),
    )
    expect(focusMock).toHaveBeenCalledOnce()
    act(() =>
      result.current.handleKeyDown({ key: 'Tab', preventDefault: vi.fn() } as never),
    )
    expect(result.current.isOpen).toBe(false)
  })

  it('routes every typed result to its canonical destination', () => {
    const hits: Array<[GlobalSearchHit, Record<string, unknown>]> = [
      [{ kind: 'page', pageKey: 'dashboard', label: 'Dashboard' }, { to: '/' }],
      [{ kind: 'page', pageKey: 'products', label: 'Produtos' }, { to: '/products' }],
      [{ kind: 'page', pageKey: 'newSale', label: 'Nova venda' }, { to: '/sales/new' }],
      [{ kind: 'page', pageKey: 'orders', label: 'Pedidos' }, { to: '/orders' }],
      [
        { kind: 'page', pageKey: 'salesChannels', label: 'Canais de venda' },
        { to: '/sales-channels' },
      ],
      [{ kind: 'page', pageKey: 'discounts', label: 'Descontos' }, { to: '/discounts' }],
      [{ kind: 'page', pageKey: 'users', label: 'Usuários' }, { to: '/users' }],
      [
        { kind: 'page', pageKey: 'shopSettings', label: 'Sorveteria' },
        { to: '/shop-settings' },
      ],
      [
        { kind: 'page', pageKey: 'subscription', label: 'Assinatura' },
        { to: '/subscription' },
      ],
      [{ kind: 'page', pageKey: 'account', label: 'Minha conta' }, { to: '/account' }],
      [
        { kind: 'page', pageKey: 'accompanimentTypes', label: 'Tipos de acompanhamento' },
        { to: '/accompaniment-types' },
      ],
      [
        {
          kind: 'product',
          productId: 'product-1',
          label: 'Leite integral',
          status: 'active',
        },
        { to: '/products/product-1' },
      ],
      [order, { to: '/orders/order-1' }],
      [
        {
          kind: 'user',
          userId: 'user-1',
          label: 'Ana Silva',
          context: 'ana@example.com',
          status: 'active',
        },
        { to: '/users/$userId', params: { userId: 'user-1' } },
      ],
      [
        {
          kind: 'salesChannel',
          salesChannelId: 'channel-1',
          label: 'Delivery próprio',
          status: 'active',
        },
        { to: '/sales-channels', search: { search: 'Delivery próprio' } },
      ],
      [
        {
          kind: 'discount',
          discountId: 'discount-1',
          label: 'Combo verão',
          status: 'active',
        },
        { to: '/discounts/discount-1' },
      ],
    ]

    const { result } = renderHook(() => useGlobalSearch())
    for (const [hit, destination] of hits) {
      act(() => result.current.handleNavigate(hit))
      expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining(destination))
      navigateMock.mockClear()
    }
  })
})
