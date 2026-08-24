import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'
import { useProduceProductDialog } from '../use-produce-product-dialog'

vi.mock('@/ui/mrp/hooks/use-production-preview-query', () => ({
  useProductionPreviewQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-register-production-action', () => ({
  useRegisterProductionAction: vi.fn(),
}))

const mockedPreview = vi.mocked(useProductionPreviewQuery)
const mockedRegister = vi.mocked(useRegisterProductionAction)
const recipe = {
  id: 'recipe-1',
  yieldQuantity: 10,
  totalCost: 12,
  unitCost: 1.2,
  maximumProducibleQuantity: 30,
  ingredients: [],
}
const preview = {
  canProduce: true,
  blockReasons: [],
  consumptions: [],
  totalCost: 12,
  currentOutputStock: 0,
  projectedOutputStock: 20,
}

describe('useProduceProductDialog', () => {
  it('converts batches to quantity and registers valid production', async () => {
    const registerProduction = vi.fn().mockResolvedValue(undefined)
    mockedPreview.mockReturnValue({
      data: preview,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    mockedRegister.mockReturnValue({ registerProduction, isPending: false } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    expect(result.current.quantity).toBe(10)
    act(() => result.current.handleModeChange('quantity'))
    expect(result.current.value).toBe('10')
    await act(async () => result.current.handleConfirm(onSuccess))
    expect(registerProduction).toHaveBeenCalledWith({ quantity: 10 })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('reports invalid batch input without registering', async () => {
    mockedPreview.mockReturnValue({
      data: preview,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    const registerProduction = vi.fn()
    mockedRegister.mockReturnValue({ registerProduction, isPending: false } as never)
    const { result } = renderHook(() =>
      useProduceProductDialog({ open: true, productId: 'product-1', recipe }),
    )

    act(() => result.current.setValue('1.5'))
    await act(async () => result.current.handleConfirm(vi.fn()))
    expect(registerProduction).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Informe um número inteiro positivo de lotes.')
  })
})
