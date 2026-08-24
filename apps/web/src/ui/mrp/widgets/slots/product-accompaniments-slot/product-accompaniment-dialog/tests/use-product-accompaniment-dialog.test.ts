import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '@scoops/core/mrp/domain/entities/fakers'

import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

import { useProductAccompanimentDialog } from '../use-product-accompaniment-dialog'

vi.mock('@/ui/mrp/hooks/use-accompaniment-candidates-query', () => ({
  useAccompanimentCandidatesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-accompaniment-types-query', () => ({
  useAccompanimentTypesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-link-product-accompaniment-action', () => ({
  useLinkProductAccompanimentAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-update-product-accompaniment-action', () => ({
  useUpdateProductAccompanimentAction: vi.fn(),
}))

const useAccompanimentCandidatesQueryMock = vi.mocked(useAccompanimentCandidatesQuery)
const useAccompanimentTypesQueryMock = vi.mocked(useAccompanimentTypesQuery)
const useLinkProductAccompanimentActionMock = vi.mocked(useLinkProductAccompanimentAction)
const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useUpdateProductAccompanimentActionMock = vi.mocked(
  useUpdateProductAccompanimentAction,
)

const candidate = ProductFaker.fake({ id: 'product-2', name: 'Granola', unit: 'g' })
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const editItem = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  estimatedCost: 0.45,
}

describe('useProductAccompanimentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccompanimentCandidatesQueryMock.mockReturnValue({
      data: [candidate],
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    useAccompanimentTypesQueryMock.mockReturnValue({
      data: { items: [{ type, usageCount: 0 }] },
      isError: false,
      isPending: false,
    } as never)
    useProductStockQueryMock.mockReturnValue({
      data: { brands: [] },
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    useLinkProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      linkProductAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
    useUpdateProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateProductAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  afterEach(() => {
    cleanup()
  })

  it('links a selected accompaniment with the parsed portion quantity', async () => {
    const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useLinkProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      linkProductAccompaniment,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        onSuccess,
        open: true,
        productId: 'product-1',
      }),
    )
    const quantity = result.current.register('quantityPerPortion')
    const quantityField = document.createElement('input')
    quantityField.name = quantity.name
    document.body.append(quantityField)
    quantity.ref(quantityField)

    act(() => {
      result.current.handleValueChange('accompanimentProductId', candidate.id)
      result.current.handleValueChange('accompanimentTypeId', type.id)
    })
    await act(async () => {
      quantityField.value = '20,5'
      await quantity.onChange({ target: quantityField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkProductAccompaniment).toHaveBeenCalledWith({
      accompanimentProductId: candidate.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 20.5,
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('updates an existing link and maps action failures', async () => {
    const updateProductAccompaniment = vi
      .fn()
      .mockRejectedValue(new Error('request failed'))
    useUpdateProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateProductAccompaniment,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )
    const quantity = result.current.register('quantityPerPortion')
    const quantityField = document.createElement('input')
    quantityField.name = quantity.name
    document.body.append(quantityField)
    quantity.ref(quantityField)

    await act(async () => {
      quantityField.value = '25'
      await quantity.onChange({ target: quantityField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(updateProductAccompaniment).toHaveBeenCalledWith({
      linkId: 'link-1',
      input: { accompanimentTypeId: type.id, quantityPerPortion: 25 },
    })
    expect(result.current.actionError).toBe('request failed')
  })
})
