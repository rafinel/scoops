import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useActiveSalesChannelsQuery } from '@/ui/pdv/hooks/use-active-sales-channels-query'
import { usePreviewOrderAction } from '@/ui/pdv/hooks/use-preview-order-action'
import { useRegisterOrderAction } from '@/ui/pdv/hooks/use-register-order-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { getNewSaleCartStorageKey } from '../new-sale-cart-storage'
import { useNewSalePage } from '../use-new-sale-page'

vi.mock('@/ui/pdv/hooks/use-active-sales-channels-query', () => ({
  useActiveSalesChannelsQuery: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-preview-order-action', () => ({
  usePreviewOrderAction: vi.fn(),
}))
vi.mock('@/ui/pdv/hooks/use-register-order-action', () => ({
  useRegisterOrderAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))

const useActiveSalesChannelsQueryMock = vi.mocked(useActiveSalesChannelsQuery)
const usePreviewOrderActionMock = vi.mocked(usePreviewOrderAction)
const useRegisterOrderActionMock = vi.mocked(useRegisterOrderAction)
const useAuthContextMock = vi.mocked(useAuthContext)

const account = { establishmentId: 'establishment-1' }

const product = {
  productId: 'product-1',
  name: 'Pote pronto',
  kind: 'resale' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  sizes: [],
  resaleBrands: [],
}

describe('useNewSalePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthContextMock.mockReturnValue({ account } as never)
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('owns local cart quantity changes and sends a preview input without prices', async () => {
    const previewOrder = vi.fn().mockResolvedValue({
      response: {
        body: {
          cart: {
            establishmentId: 'establishment-1',
            lines: [],
            discounts: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
          },
          previewToken: 'preview-token',
        },
        isFailure: false,
        statusCode: 200,
      },
    })
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    const line = {
      accompanimentIds: [],
      kind: 'resale' as const,
      productId: product.productId,
      quantity: 1,
    }

    act(() => result.current.handleSelectProduct(product))
    act(() => result.current.handleSaveLine(line))
    act(() => result.current.handleQuantityChange(product.productId, 2))

    await waitFor(() => expect(result.current.lineInputs[0]?.quantity).toBe(2))
    await waitFor(() => expect(previewOrder).toHaveBeenCalled())
    const request = previewOrder.mock.calls.at(-1)?.[0]
    expect(request).toEqual({
      lines: [{ kind: 'resale', productId: product.productId, quantity: 2 }],
    })
    expect(request).not.toHaveProperty('total')
    expect(request).not.toHaveProperty('price')
  })

  it('restores the cart from localStorage and requests a fresh preview', async () => {
    const line = {
      accompanimentIds: [],
      kind: 'resale' as const,
      productId: product.productId,
      quantity: 2,
    }
    const previewOrder = vi.fn().mockResolvedValue({
      response: {
        body: {
          cart: {
            establishmentId: 'establishment-1',
            lines: [],
            discounts: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
          },
          previewToken: 'preview-token',
        },
        isFailure: false,
        statusCode: 200,
      },
    })
    window.localStorage.setItem(
      getNewSaleCartStorageKey(account.establishmentId),
      JSON.stringify({ version: 1, lineInputs: [line], products: [product] }),
    )
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)

    const { result } = renderHook(() => useNewSalePage())

    await waitFor(() => expect(result.current.lineInputs).toEqual([line]))
    expect(result.current.catalogProducts).toEqual([product])
    await waitFor(() =>
      expect(previewOrder).toHaveBeenCalledWith({
        lines: [{ kind: 'resale', productId: product.productId, quantity: 2 }],
      }),
    )
  })

  it('removes the persisted cart when the current order is cleared', async () => {
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder: vi.fn().mockResolvedValue({
        response: {
          body: {
            cart: {
              establishmentId: 'establishment-1',
              lines: [],
              discounts: [],
              subtotal: 0,
              totalDiscount: 0,
              total: 0,
            },
            previewToken: 'preview-token',
          },
          isFailure: false,
          statusCode: 200,
        },
      }),
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    act(() =>
      result.current.handleSaveLine({
        accompanimentIds: [],
        kind: 'resale',
        productId: product.productId,
        quantity: 1,
      }),
    )

    await waitFor(() =>
      expect(
        window.localStorage.getItem(getNewSaleCartStorageKey(account.establishmentId)),
      ).not.toBeNull(),
    )
    act(() => result.current.handleClear())

    await waitFor(() =>
      expect(
        window.localStorage.getItem(getNewSaleCartStorageKey(account.establishmentId)),
      ).toBeNull(),
    )
  })

  it('creates a new idempotency key for every cart or channel mutation', () => {
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder: vi.fn(),
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    const line = {
      accompanimentIds: [],
      kind: 'resale' as const,
      productId: product.productId,
      quantity: 1,
    }

    act(() => result.current.handleSaveLine(line))
    const afterAdd = result.current.idempotencyKey
    act(() => result.current.handleQuantityChange(product.productId, 2))
    const afterQuantity = result.current.idempotencyKey
    act(() => result.current.handleChannelChange('channel-1'))
    const afterChannel = result.current.idempotencyKey

    expect(afterAdd).toBeTruthy()
    expect(afterQuantity).toBeTruthy()
    expect(afterChannel).toBeTruthy()
    expect(afterQuantity).not.toBe(afterAdd)
    expect(afterChannel).not.toBe(afterQuantity)
  })

  it('reuses the unchanged registration request key only for a retry', async () => {
    const previewOrder = vi.fn().mockResolvedValue({
      response: {
        body: {
          cart: {
            establishmentId: 'establishment-1',
            lines: [],
            discounts: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0,
          },
          previewToken: 'preview-token',
        },
        isFailure: false,
        statusCode: 200,
      },
    })
    const registerOrder = vi
      .fn()
      .mockResolvedValueOnce({ response: { isFailure: true, statusCode: 503 } })
      .mockResolvedValueOnce({
        response: {
          body: { kind: 'registered', order: {}, replayed: false },
          isFailure: false,
          statusCode: 201,
        },
      })
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder,
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    act(() =>
      result.current.handleSaveLine({
        accompanimentIds: [],
        kind: 'resale',
        productId: product.productId,
        quantity: 1,
      }),
    )
    await waitFor(() => expect(result.current.previewToken).toBe('preview-token'))
    act(() => result.current.handleRegister())
    await act(async () => {
      await result.current.handleConfirmRegistration()
    })

    expect(result.current.registrationFeedback).toBe('rollback')
    const firstRequest = registerOrder.mock.calls[0]?.[0]

    act(() => result.current.handleRetryRegistration())
    await waitFor(() => expect(result.current.registeredOrder).toBeDefined())

    expect(registerOrder).toHaveBeenCalledTimes(2)
    expect(registerOrder.mock.calls[1]?.[0]).toEqual(firstRequest)
  })

  it('surfaces preview failures and refreshes the request when the user retries', async () => {
    const previewOrder = vi
      .fn()
      .mockResolvedValueOnce({
        response: { isFailure: true, errorMessage: 'Preço indisponível' },
      })
      .mockResolvedValueOnce({
        response: {
          body: {
            cart: {
              establishmentId: 'establishment-1',
              lines: [],
              discounts: [],
              subtotal: 10,
              totalDiscount: 0,
              total: 10,
            },
            previewToken: 'refreshed-preview',
          },
          isFailure: false,
          statusCode: 200,
        },
      })
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    act(() =>
      result.current.handleSaveLine({
        accompanimentIds: [],
        kind: 'resale',
        productId: product.productId,
        quantity: 1,
      }),
    )
    await waitFor(() => expect(result.current.previewError).toBe('Preço indisponível'))

    act(() => result.current.handleRefreshPreview())
    await waitFor(() => expect(result.current.previewToken).toBe('refreshed-preview'))
    expect(previewOrder).toHaveBeenCalledTimes(2)
    expect(result.current.previewError).toBeUndefined()
  })

  it('keeps the cart safe when quantities are outside the supported bounds', async () => {
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder: vi.fn(),
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder: vi.fn(),
    } as never)
    const { result } = renderHook(() => useNewSalePage())
    const line = {
      accompanimentIds: [],
      kind: 'resale' as const,
      productId: product.productId,
      quantity: 1,
    }

    act(() => result.current.handleSaveLine(line))
    act(() => result.current.handleQuantityChange(product.productId, 0))
    act(() => result.current.handleQuantityChange(product.productId, 1000))
    expect(result.current.lineInputs).toEqual([line])

    act(() => result.current.handleEditLine(line, undefined))
    expect(result.current.selectedProduct).toBeUndefined()
    act(() => result.current.handleDialogOpenChange(false))
    expect(result.current.editingLine).toBeUndefined()
  })

  it('maps a transient registration response to a verification retry and then a registered order', async () => {
    const previewOrder = vi.fn().mockResolvedValue({
      response: {
        body: {
          cart: {
            establishmentId: 'establishment-1',
            lines: [],
            discounts: [],
            subtotal: 10,
            totalDiscount: 0,
            total: 10,
          },
          previewToken: 'preview-token',
        },
        isFailure: false,
        statusCode: 200,
      },
    })
    const registerOrder = vi
      .fn()
      .mockResolvedValueOnce({ response: { statusCode: 0, isFailure: true } })
      .mockResolvedValueOnce({
        response: {
          body: { kind: 'registered', order: { id: 'order-1' }, replayed: false },
          isFailure: false,
          statusCode: 201,
        },
      })
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder,
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    act(() =>
      result.current.handleSaveLine({
        accompanimentIds: [],
        kind: 'resale',
        productId: product.productId,
        quantity: 1,
      }),
    )
    await waitFor(() => expect(result.current.previewToken).toBe('preview-token'))
    act(() => result.current.handleRegister())
    await act(async () => result.current.handleConfirmRegistration())

    await waitFor(() => expect(result.current.registeredOrder).toEqual({ id: 'order-1' }))
    expect(registerOrder).toHaveBeenCalledTimes(2)
    expect(result.current.isVerification).toBe(false)
    expect(result.current.lineInputs).toEqual([])
  })

  it('keeps the preview usable for a repriced conflict and reopens confirmation on review', async () => {
    const previewOrder = vi.fn().mockResolvedValue({
      response: {
        body: {
          cart: {
            establishmentId: 'establishment-1',
            lines: [],
            discounts: [],
            subtotal: 10,
            totalDiscount: 0,
            total: 10,
          },
          previewToken: 'preview-token',
        },
        isFailure: false,
        statusCode: 200,
      },
    })
    const recalculatedCart = {
      establishmentId: 'establishment-1',
      lines: [
        {
          accompanimentIds: [],
          kind: 'resale' as const,
          productId: product.productId,
          quantity: 2,
        },
      ],
      discounts: [],
      subtotal: 20,
      totalDiscount: 0,
      total: 20,
    }
    const registerOrder = vi
      .fn()
      .mockResolvedValueOnce({
        response: {
          body: {
            kind: 'repriced',
            recalculatedCart,
            previewToken: 'new-preview',
            changes: [],
          },
          isFailure: true,
          statusCode: 409,
        },
      })
      .mockResolvedValueOnce({
        response: {
          body: { kind: 'review-required', shortages: [], changes: [] },
          isFailure: false,
          statusCode: 201,
        },
      })
    useActiveSalesChannelsQueryMock.mockReturnValue({
      activeSalesChannels: [],
      isActiveSalesChannelsError: false,
      isLoadingActiveSalesChannels: false,
    } as never)
    usePreviewOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      previewOrder,
    } as never)
    useRegisterOrderActionMock.mockReturnValue({
      error: null,
      isPending: false,
      registerOrder,
    } as never)

    const { result } = renderHook(() => useNewSalePage())
    act(() =>
      result.current.handleSaveLine({
        accompanimentIds: [],
        kind: 'resale',
        productId: product.productId,
        quantity: 1,
      }),
    )
    await waitFor(() => expect(result.current.previewToken).toBe('preview-token'))
    act(() => result.current.handleRegister())
    await act(async () => result.current.handleConfirmRegistration())

    expect(result.current.registrationResult?.kind).toBe('repriced')
    expect(result.current.lineInputs[0]?.quantity).toBe(2)
    act(() => result.current.handleFeedbackAction())
    expect(result.current.isRegistrationOpen).toBe(true)
    await act(async () => result.current.handleConfirmRegistration())
    expect(result.current.registrationResult?.kind).toBe('review-required')
  })
})
