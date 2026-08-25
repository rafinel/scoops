import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CategoryDependencyDialog } from '../index'
import { useCategoryDependencyDialog } from '../use-category-dependency-dialog'

vi.mock('../use-category-dependency-dialog', () => ({
  useCategoryDependencyDialog: vi.fn(),
}))
const hookMock = vi.mocked(useCategoryDependencyDialog)

const dependency = {
  kind: 'consuming-recipe' as const,
  productId: 'recipe-1',
  productName: 'Receita de açaí',
}

describe('CategoryDependencyDialog', () => {
  it('lists blockers with direct actions and exposes confirmation state', () => {
    const action = vi.fn()
    hookMock.mockReturnValue({
      handleDependencyAction: action,
      handleOpenChange: vi.fn(),
    })
    render(
      <CategoryDependencyDialog
        canRemove={false}
        category='ingredient'
        dependencies={[dependency]}
        isLoading={false}
        isPending={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        onRetry={vi.fn()}
        open
        productId='product-1'
        productName='Açaí'
      />,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Receita de açaí')).toBeTruthy()
    screen.getByRole('button', { name: 'Abrir receita' }).click()
    expect(action).toHaveBeenCalledWith(dependency)
  })

  it('shows a named confirmation for an unused category', () => {
    const onConfirm = vi.fn()
    hookMock.mockReturnValue({
      handleDependencyAction: vi.fn(),
      handleOpenChange: vi.fn(),
    })
    render(
      <CategoryDependencyDialog
        canRemove
        category='portion'
        dependencies={[]}
        isLoading={false}
        isPending={false}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
        onRetry={vi.fn()}
        open
        productId='product-1'
        productName='Açaí'
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Remover categoria Porção?' }),
    ).toBeTruthy()
    screen.getByRole('button', { name: 'Remover categoria' }).click()
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
