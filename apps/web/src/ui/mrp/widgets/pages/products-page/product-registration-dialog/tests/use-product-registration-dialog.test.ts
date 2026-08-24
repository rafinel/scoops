import { act, renderHook } from '@testing-library/react'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'
import { useProductRegistrationDialog } from '../use-product-registration-dialog'

vi.mock('@/ui/mrp/hooks/use-register-product-action', () => ({
  useRegisterProductAction: vi.fn(),
}))
const useRegisterProductActionMock = vi.mocked(useRegisterProductAction)

describe('useProductRegistrationDialog', () => {
  it('keeps portion and resale categories mutually exclusive and creates brands on demand', () => {
    useRegisterProductActionMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
    const { result } = renderHook(() =>
      useProductRegistrationDialog({ onSuccess: vi.fn() }),
    )

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Portion))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Resale))
    expect(result.current.categories).toEqual([ProductCategory.Resale])

    act(() => result.current.handleStockControlChange(ProductStockControl.ByBrand))
    expect(result.current.stockControl).toBe(ProductStockControl.ByBrand)
    expect(result.current.brands).toHaveLength(1)
    expect(result.current.isCategoryDisabled(ProductCategory.Portion)).toBe(true)
  })
})
