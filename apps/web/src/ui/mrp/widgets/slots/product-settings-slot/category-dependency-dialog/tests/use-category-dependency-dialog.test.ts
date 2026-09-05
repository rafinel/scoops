import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    {
      dependency: {
        kind: 'consuming-recipe',
        productId: 'recipe-1',
        productName: 'Receita consumidora',
      },
      expectedPath: `${ROUTES.productDetailsRecipe.replace('$productId', 'recipe-1')}?retryCategory=ingredient&retryDependency=consuming-recipe&retryProductId=product-1`,
    },
    {
      dependency: {
        kind: 'owned-recipe',
        productId: 'recipe-2',
        productName: 'Receita própria',
      },
      expectedPath: `${ROUTES.productDetailsRecipe.replace('$productId', 'recipe-2')}?retryCategory=ingredient&retryDependency=owned-recipe&retryProductId=product-1`,
    },
    {
      dependency: {
        kind: 'portion-size',
        productId: 'portion-1',
        productName: 'Porção média',
        sizeCount: 2,
      },
      expectedPath: `${ROUTES.productDetailsPrices.replace('$productId', 'portion-1')}?retryCategory=ingredient&retryDependency=portion-size&retryProductId=product-1&focus=sizes`,
    },
    {
      dependency: {
        kind: 'portion-accompaniment',
        productId: 'portion-2',
        productName: 'Acompanhamentos',
        linkCount: 3,
      },
      expectedPath: `${ROUTES.productDetailsAccompaniments.replace('$productId', 'portion-2')}?retryCategory=ingredient&retryDependency=portion-accompaniment&retryProductId=product-1`,
    },
    {
      dependency: {
        kind: 'accompaniment-user',
        productId: 'product-2',
        productName: 'Açaí tropical',
      },
      expectedPath: `${ROUTES.products}?retryCategory=ingredient&retryDependency=accompaniment-user&retryProductId=product-1&usedAsAccompanimentId=product-1`,
    },
    {
      dependency: {
        kind: 'resale-configuration',
        productId: 'resale-1',
        productName: 'Revenda',
        configurationCount: 1,
      },
      expectedPath: `${ROUTES.productDetailsPrices.replace('$productId', 'resale-1')}?retryCategory=ingredient&retryDependency=resale-configuration&retryProductId=product-1&focus=resale`,
    },
  ] satisfies ReadonlyArray<{
    dependency: ProductCategoryDependency
    expectedPath: string
  }>)(
    'maps $dependency.kind to its owning route with retry context',
    ({ dependency, expectedPath }) => {
      const navigateToPath = vi.fn()
      useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath })
      const { result } = renderHook(() => useCategoryDependencyDialog(baseProps))

      result.current.handleDependencyAction(dependency)

      expect(navigateToPath).toHaveBeenCalledWith(expectedPath)
    },
  )

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

  it('forwards open and close changes when removal is not pending', () => {
    const onOpenChange = vi.fn()
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath: vi.fn() })
    const { result } = renderHook(() =>
      useCategoryDependencyDialog({ ...baseProps, onOpenChange }),
    )

    result.current.handleOpenChange(false)
    result.current.handleOpenChange(true)

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false)
    expect(onOpenChange).toHaveBeenNthCalledWith(2, true)
  })
})
