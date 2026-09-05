import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

import { DependencyItem } from '../index'

const dependencies = [
  {
    kind: 'consuming-recipe',
    productId: 'recipe-1',
    productName: 'Receita consumidora',
    description: 'Usado em receita',
    actionLabel: 'Abrir receita',
  },
  {
    kind: 'owned-recipe',
    productId: 'recipe-2',
    productName: 'Receita própria',
    description: 'Receita própria',
    actionLabel: 'Abrir receita',
  },
  {
    kind: 'portion-size',
    productId: 'portion-1',
    productName: 'Porção média',
    sizeCount: 2,
    description: '2 tamanho(s) configurado(s)',
    actionLabel: 'Abrir tamanhos',
  },
  {
    kind: 'portion-accompaniment',
    productId: 'portion-2',
    productName: 'Acompanhamentos',
    linkCount: 3,
    description: '3 acompanhamento(s) vinculado(s)',
    actionLabel: 'Abrir acompanhamentos',
  },
  {
    kind: 'accompaniment-user',
    productId: 'product-2',
    productName: 'Açaí tropical',
    description: 'Usado como acompanhamento',
    actionLabel: 'Ver produtos',
  },
  {
    kind: 'resale-configuration',
    productId: 'resale-1',
    productName: 'Revenda',
    configurationCount: 1,
    description: '1 configuração(ões) de revenda',
    actionLabel: 'Abrir revenda',
  },
] satisfies ReadonlyArray<
  ProductCategoryDependency & {
    description: string
    actionLabel: string
  }
>

describe('DependencyItem', () => {
  afterEach(cleanup)

  it.each(dependencies)(
    'renders the $kind description and action label',
    (dependencyData) => {
      const onAction = vi.fn()
      render(
        <DependencyItem
          canRemove={false}
          dependency={dependencyData}
          onAction={onAction}
        />,
      )

      expect(screen.getAllByText(dependencyData.productName).length).toBeGreaterThan(0)
      expect(screen.getAllByText(dependencyData.description).length).toBeGreaterThan(0)
      fireEvent.click(screen.getByRole('button', { name: dependencyData.actionLabel }))
      expect(onAction).toHaveBeenCalledOnce()
    },
  )

  it('hides the dependency action while the category can be removed', () => {
    const onAction = vi.fn()
    render(<DependencyItem canRemove dependency={dependencies[2]} onAction={onAction} />)

    expect(screen.getByText('Porção média')).not.toBeNull()
    expect(screen.getByText('2 tamanho(s) configurado(s)')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Abrir tamanhos' })).toBeNull()
    expect(onAction).not.toHaveBeenCalled()
  })
})
