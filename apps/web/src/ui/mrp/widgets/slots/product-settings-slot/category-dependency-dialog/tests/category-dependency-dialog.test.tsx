import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

import { CategoryDependencyDialog } from '../index'
import { useCategoryDependencyDialog } from '../use-category-dependency-dialog'

vi.mock('../use-category-dependency-dialog', () => ({
  useCategoryDependencyDialog: vi.fn(),
}))
const useCategoryDependencyDialogMock = vi.mocked(useCategoryDependencyDialog)

const dependencies = [
  {
    kind: 'consuming-recipe',
    productId: 'recipe-1',
    productName: 'Receita de açaí',
  },
  {
    kind: 'owned-recipe',
    productId: 'recipe-2',
    productName: 'Receita própria',
  },
  {
    kind: 'portion-size',
    productId: 'portion-1',
    productName: 'Porção média',
    sizeCount: 2,
  },
  {
    kind: 'portion-accompaniment',
    productId: 'portion-2',
    productName: 'Acompanhamentos da porção',
    linkCount: 3,
  },
  {
    kind: 'accompaniment-user',
    productId: 'product-2',
    productName: 'Açaí tropical',
  },
  {
    kind: 'resale-configuration',
    productId: 'resale-1',
    productName: 'Configuração de revenda',
    configurationCount: 1,
  },
] satisfies readonly ProductCategoryDependency[]

const actionLabels = [
  'Abrir receita',
  'Abrir receita',
  'Abrir tamanhos',
  'Abrir acompanhamentos',
  'Ver produtos',
  'Abrir revenda',
]

describe('CategoryDependencyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCategoryDependencyDialogMock.mockReturnValue({
      handleDependencyAction: vi.fn(),
      handleOpenChange: vi.fn(),
    })
  })

  afterEach(cleanup)

  it('renders every dependency kind with its localized description and action', () => {
    const handleDependencyAction = vi.fn()
    useCategoryDependencyDialogMock.mockReturnValue({
      handleDependencyAction,
      handleOpenChange: vi.fn(),
    })
    render(
      <CategoryDependencyDialog
        canRemove={false}
        category='ingredient'
        dependencies={dependencies}
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

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Usado em receita')).not.toBeNull()
    expect(screen.getAllByText('Receita própria')).toHaveLength(2)
    expect(screen.getByText('2 tamanho(s) configurado(s)')).not.toBeNull()
    expect(screen.getByText('3 acompanhamento(s) vinculado(s)')).not.toBeNull()
    expect(screen.getByText('Usado como acompanhamento')).not.toBeNull()
    expect(screen.getByText('1 configuração(ões) de revenda')).not.toBeNull()

    expect(screen.getAllByRole('button', { name: 'Abrir receita' })).toHaveLength(2)
    for (const actionLabel of [
      'Abrir tamanhos',
      'Abrir acompanhamentos',
      'Ver produtos',
      'Abrir revenda',
    ]) {
      expect(screen.getByRole('button', { name: actionLabel })).not.toBeNull()
    }

    for (const [index, actionLabel] of actionLabels.entries()) {
      const matchingButtons = screen.getAllByRole('button', { name: actionLabel })
      fireEvent.click(matchingButtons[actionLabel === 'Abrir receita' ? index : 0])
    }

    expect(handleDependencyAction).toHaveBeenCalledTimes(dependencies.length)
    expect(handleDependencyAction.mock.calls.map(([dependency]) => dependency)).toEqual(
      dependencies,
    )
  })

  it('shows a named confirmation and delegates removal for an unused category', () => {
    const onConfirm = vi.fn()
    useCategoryDependencyDialogMock.mockReturnValue({
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
    ).not.toBeNull()
    expect(screen.getByText(/Nenhum vínculo impede a remoção/)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Remover categoria' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders loading state without actions or confirmation', () => {
    render(
      <CategoryDependencyDialog
        canRemove
        category='manufacturable'
        dependencies={dependencies}
        isLoading
        isPending={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        onRetry={vi.fn()}
        open
        productId='product-1'
        productName='Açaí'
      />,
    )

    expect(
      screen.getByRole('status', { name: 'Carregando vínculos da categoria' }),
    ).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Verificando vínculos…' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover categoria' })).toBeNull()
    expect(screen.queryByText('Receita de açaí')).toBeNull()
  })

  it('shows a retry action when dependency lookup fails', () => {
    const onRetry = vi.fn()
    render(
      <CategoryDependencyDialog
        canRemove={false}
        category='resale'
        dependencies={[]}
        error='Não foi possível verificar os vínculos.'
        isLoading={false}
        isPending={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        onRetry={onRetry}
        open
        productId='product-1'
        productName='Açaí'
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível verificar os vínculos.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Entendi' })).not.toBeNull()
  })

  it('disables cancellation and confirmation while removal is pending', () => {
    const onConfirm = vi.fn()
    const handleOpenChange = vi.fn()
    useCategoryDependencyDialogMock.mockReturnValue({
      handleDependencyAction: vi.fn(),
      handleOpenChange,
    })
    render(
      <CategoryDependencyDialog
        canRemove
        category='portion'
        dependencies={[]}
        isLoading={false}
        isPending
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
        onRetry={vi.fn()}
        open
        productId='product-1'
        productName='Açaí'
      />,
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    const confirmButton = screen.getByRole('button', { name: 'Removendo…' })
    expect((cancelButton as HTMLButtonElement).disabled).toBe(true)
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(cancelButton)
    fireEvent.click(confirmButton)
    expect(handleOpenChange).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('renders only when open and delegates the close action to its hook', () => {
    const handleOpenChange = vi.fn()
    useCategoryDependencyDialogMock.mockReturnValue({
      handleDependencyAction: vi.fn(),
      handleOpenChange,
    })
    const { rerender } = render(
      <CategoryDependencyDialog
        canRemove={false}
        category='ingredient'
        dependencies={[]}
        isLoading={false}
        isPending={false}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        onRetry={vi.fn()}
        open={false}
        productId='product-1'
        productName='Açaí'
      />,
    )
    expect(screen.queryByRole('dialog')).toBeNull()

    rerender(
      <CategoryDependencyDialog
        canRemove={false}
        category='ingredient'
        dependencies={[]}
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
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})
