import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useCategoryDependencyDialog } from '../use-category-dependency-dialog'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useNavigationMock = vi.mocked(useNavigation)
const baseProps = {
  category: 'ingredient' as const,
  dependencies: [],
  isPending: false,
  onConfirm: vi.fn(),
  onOpenChange: vi.fn(),
  open: true,
  productId: 'product-1',
  productName: 'Açaí',
  canRemove: false,
  isLoading: false,
  onRetry: vi.fn(),
}

describe('useCategoryDependencyDialog', () => {
  it('maps dependency actions to the owning product route with retry context', () => {
    const navigateToPath = vi.fn()
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath })
    const { result } = renderHook(() => useCategoryDependencyDialog(baseProps))

    result.current.handleDependencyAction({
      kind: 'portion-size',
      productId: 'portion-1',
      productName: 'Tamanho médio',
      sizeCount: 1,
    })

    expect(navigateToPath).toHaveBeenCalledWith(
      `${ROUTES.productDetailsPrices.replace('$productId', 'portion-1')}?retryCategory=ingredient&retryDependency=portion-size&retryProductId=product-1&focus=sizes`,
    )
  })

  it('filters products by the accompaniment being removed', () => {
    const navigateToPath = vi.fn()
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath })
    const { result } = renderHook(() =>
      useCategoryDependencyDialog({
        ...baseProps,
        category: 'accompaniment',
        productId: 'accompaniment-1',
      }),
    )

    result.current.handleDependencyAction({
      kind: 'accompaniment-user',
      productId: 'portion-1',
      productName: 'Açaí tropical',
    })

    expect(navigateToPath).toHaveBeenCalledWith(
      `${ROUTES.products}?retryCategory=accompaniment&retryDependency=accompaniment-user&retryProductId=accompaniment-1&usedAsAccompanimentId=accompaniment-1`,
    )
  })

  it('does not close while a removal confirmation is pending', () => {
    const onOpenChange = vi.fn()
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath: vi.fn() })
    const { result } = renderHook(() =>
      useCategoryDependencyDialog({ ...baseProps, isPending: true, onOpenChange }),
    )

    result.current.handleOpenChange(false)
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
