import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { UnitChangeDialog } from '../index'
import { useUnitChangeDialog } from '../use-unit-change-dialog'

vi.mock('../use-unit-change-dialog', () => ({ useUnitChangeDialog: vi.fn() }))
const hookMock = vi.mocked(useUnitChangeDialog)
const product = ProductFaker.fake({ unit: 'g' })

const baseState = {
  hasUnitChangePreviewError: false,
  isChangingProductUnit: false,
  isLoadingUnitChangePreview: false,
  isPendingUnitChangePreview: false,
  retryUnitChangePreview: vi.fn(),
  handleOpenChange: vi.fn(),
  handleConfirm: vi.fn(),
  changeProductUnitError: null,
  unitChangePreviewError: null,
}

describe('UnitChangeDialog', () => {
  it('renders the impact and confirms a numeric-preserving unit change', () => {
    const confirm = vi.fn()
    hookMock.mockReturnValue({
      ...baseState,
      handleConfirm: confirm,
      unitChangePreview: {
        currentUnit: 'g',
        targetUnit: 'kg',
        affected: {
          balances: 2,
          brands: [],
          recipeYields: 1,
          recipeIngredients: 3,
          sizes: 0,
          accompanimentLinks: 0,
          hasIdealStock: true,
          hasCurrentUnitCost: true,
        },
      },
    })
    render(
      <UnitChangeDialog
        currentUnit='g'
        onOpenChange={vi.fn()}
        open
        product={product}
        targetUnit='kg'
      />,
    )
    expect(screen.getByText('O que será atualizado')).toBeTruthy()
    screen.getByRole('button', { name: 'Alterar unidade' }).click()
    expect(confirm).toHaveBeenCalledOnce()
  })

  it('confirms a cross-dimension unit change without asking for factors', () => {
    const confirm = vi.fn()
    hookMock.mockReturnValue({
      ...baseState,
      handleConfirm: confirm,
      unitChangePreview: {
        currentUnit: 'g',
        targetUnit: 'un',
        affected: {
          balances: 1,
          brands: [],
          recipeYields: 0,
          recipeIngredients: 0,
          sizes: 0,
          accompanimentLinks: 0,
          hasIdealStock: false,
          hasCurrentUnitCost: false,
        },
      },
    })
    render(
      <UnitChangeDialog
        currentUnit='g'
        onOpenChange={vi.fn()}
        open
        product={product}
        targetUnit='un'
      />,
    )
    expect(
      screen.getAllByText(/sem alterar os valores numéricos existentes/i),
    ).not.toHaveLength(0)
    screen.getByRole('button', { name: 'Alterar unidade' }).click()
    expect(confirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole('textbox', { name: /fator/i })).toBeNull()
  })
})
