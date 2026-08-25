import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useChangeProductUnitAction } from '@/ui/mrp/hooks/use-change-product-unit-action'
import { usePreviewProductUnitChangeQuery } from '@/ui/mrp/hooks/use-preview-product-unit-change-query'
import { showErrorToast } from '@/ui/shared/notifications'

import { useUnitChangeDialog } from '../use-unit-change-dialog'

vi.mock('@/ui/mrp/hooks/use-change-product-unit-action', () => ({
  useChangeProductUnitAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-preview-product-unit-change-query', () => ({
  usePreviewProductUnitChangeQuery: vi.fn(),
}))
vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))

const useChangeProductUnitActionMock = vi.mocked(useChangeProductUnitAction)
const usePreviewProductUnitChangeQueryMock = vi.mocked(usePreviewProductUnitChangeQuery)
const showErrorToastMock = vi.mocked(showErrorToast)
const product = ProductFaker.fake({ unit: 'g' })
const preview = {
  unitChangePreview: {
    currentUnit: 'g' as const,
    targetUnit: 'kg' as const,
  },
  unitChangePreviewError: null,
  hasUnitChangePreviewError: false,
  isLoadingUnitChangePreview: false,
  isPendingUnitChangePreview: false,
  retryUnitChangePreview: vi.fn(),
}

describe('useUnitChangeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePreviewProductUnitChangeQueryMock.mockReturnValue(preview as never)
    useChangeProductUnitActionMock.mockReturnValue({
      changeProductUnit: vi.fn().mockResolvedValue(undefined),
      changeProductUnitError: null,
      isChangingProductUnit: false,
    } as never)
  })

  it('changes a unit and closes after success', async () => {
    const changeProductUnit = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    useChangeProductUnitActionMock.mockReturnValue({
      changeProductUnit,
      changeProductUnitError: null,
      isChangingProductUnit: false,
    } as never)
    const { result } = renderHook(() =>
      useUnitChangeDialog({
        currentUnit: 'g',
        onOpenChange,
        open: true,
        product,
        targetUnit: 'kg',
      }),
    )

    await act(async () => result.current.handleConfirm())

    expect(changeProductUnit).toHaveBeenCalledWith({
      targetUnit: 'kg',
      expectedUpdatedAt: product.updatedAt,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('allows cross-dimension changes, blocks pending close, and reports failures', async () => {
    const onOpenChange = vi.fn()
    const changeProductUnit = vi.fn().mockRejectedValue(new Error('Falha'))
    usePreviewProductUnitChangeQueryMock.mockReturnValue({
      ...preview,
    } as never)
    useChangeProductUnitActionMock.mockReturnValue({
      changeProductUnit,
      changeProductUnitError: null,
      isChangingProductUnit: false,
    } as never)
    const { result, rerender } = renderHook(() =>
      useUnitChangeDialog({
        currentUnit: 'g',
        onOpenChange,
        open: true,
        product,
        targetUnit: 'kg',
      }),
    )

    await act(async () => result.current.handleConfirm())
    expect(changeProductUnit).toHaveBeenCalledWith({
      targetUnit: 'kg',
      expectedUpdatedAt: product.updatedAt,
    })

    usePreviewProductUnitChangeQueryMock.mockReturnValue(preview as never)
    useChangeProductUnitActionMock.mockReturnValue({
      changeProductUnit,
      changeProductUnitError: null,
      isChangingProductUnit: true,
    } as never)
    rerender()
    act(() => result.current.handleOpenChange(false))
    expect(onOpenChange).not.toHaveBeenCalled()

    useChangeProductUnitActionMock.mockReturnValue({
      changeProductUnit,
      changeProductUnitError: null,
      isChangingProductUnit: false,
    } as never)
    rerender()
    await act(async () => result.current.handleConfirm())
    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível alterar a unidade. Tente novamente.',
    )
  })
})
