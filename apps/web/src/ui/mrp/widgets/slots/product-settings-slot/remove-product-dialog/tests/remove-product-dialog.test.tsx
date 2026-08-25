import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { RemoveProductDialog } from '../index'
import { useRemoveProductDialog } from '../use-remove-product-dialog'

vi.mock('../use-remove-product-dialog', () => ({ useRemoveProductDialog: vi.fn() }))
const useRemoveProductDialogMock = vi.mocked(useRemoveProductDialog)

describe('RemoveProductDialog', () => {
  afterEach(cleanup)

  it('names retained history and keeps the confirm action local', () => {
    const confirm = vi.fn()
    useRemoveProductDialogMock.mockReturnValue({
      handleConfirm: confirm,
      handleOpenChange: vi.fn(),
      isLoadingProductRemovalImpact: false,
      isPendingProductRemovalImpact: false,
      hasProductRemovalImpactError: false,
      productRemovalImpactError: null,
      retryProductRemovalImpact: vi.fn(),
      isRemovingProduct: false,
      removeProductError: null,
      productRemovalImpact: {
        productName: 'Açaí',
        removable: {
          brands: 1,
          balances: 2,
          ownedRecipe: 0,
          sizes: 1,
          resaleConfigurations: 0,
          ownedAccompanimentLinks: 0,
          consumingRecipeLinks: 1,
          inverseAccompanimentLinks: 0,
        },
        retainedHistory: { stockTransactions: 4, productions: 1, orders: 2 },
      },
    })
    render(
      <RemoveProductDialog
        onOpenChange={vi.fn()}
        open
        product={ProductFaker.fake({ name: 'Açaí' })}
      />,
    )
    expect(screen.getByText(/Nenhuma remoção parcial será feita/)).toBeTruthy()
    expect(screen.getByText('Receita própria')).toBeTruthy()
    expect(screen.getByText('Acompanhamentos do produto')).toBeTruthy()
    screen.getByRole('button', { name: 'Remover produto' }).click()
    expect(confirm).toHaveBeenCalledOnce()
  })
})
