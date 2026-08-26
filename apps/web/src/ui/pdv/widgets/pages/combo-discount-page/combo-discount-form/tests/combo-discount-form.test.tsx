import { cleanup, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComboDiscountForm } from '..'
import { useComboDiscountForm } from '../use-combo-discount-form'

vi.mock('../use-combo-discount-form', () => ({ useComboDiscountForm: vi.fn() }))
vi.mock('../../combo-product-dialog', () => ({
  ComboProductDialog: () => <div data-testid='product-dialog' />,
}))

describe('ComboDiscountForm', () => {
  afterEach(cleanup)
  beforeEach(() =>
    vi.mocked(useComboDiscountForm).mockReturnValue({
      addProductButtonRef: createRef<HTMLButtonElement>(),
      componentDetails: [],
      componentPendingRemoval: undefined,
      errors: {},
      fixedPriceNumber: 0,
      formatCurrency: (value: number) => `R$ ${value}`,
      handleAddComponent: vi.fn(),
      handleCancel: vi.fn(),
      handleOpenProductDialog: vi.fn(),
      handleProductDialogOpenChange: vi.fn(),
      handleQuantityChange: vi.fn(),
      handleRemoveProductDialogOpenChange: vi.fn(),
      handleRequestRemoveComponent: vi.fn(),
      handleConfirmRemoveComponent: vi.fn(),
      handleStatusChange: vi.fn(),
      handleSubmit: vi.fn(),
      isProductDialogOpen: false,
      isRemoveProductDialogOpen: false,
      isSubmitDisabled: true,
      normalPrice: 0,
      register: vi.fn() as ReturnType<typeof useComboDiscountForm>['register'],
      savings: 0,
      status: 'active',
      submitError: null,
      resolveRemoveProductFinalFocus: vi.fn(),
    }),
  )

  it('exposes the contracted basic, product and pricing form sections', () => {
    render(
      <ComboDiscountForm
        isPending={false}
        mode='create'
        onCancel={vi.fn()}
        onRequestStatusChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        submitError={null}
      />,
    )
    expect(screen.getByLabelText('Nome do combo')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Produtos do Combo' })).toBeTruthy()
    expect(screen.getByLabelText('Preço do combo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Adicionar produto' })).toBeTruthy()
  })
})
