import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComboDiscountForm } from '..'

vi.mock('../../combo-product-dialog', () => ({
  ComboProductDialog: () => null,
}))
vi.mock('../remove-combo-product-dialog', () => ({
  RemoveComboProductDialog: () => null,
}))

const pricingError = 'O preço do combo deve ser menor que o valor normal dos produtos.'

const initialDetails = {
  combo: {
    components: [
      {
        kind: 'portion' as const,
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
        sizeId: '11111111-1111-4111-8111-111111111112',
        accompanimentIds: [],
      },
      {
        kind: 'resale' as const,
        productId: '11111111-1111-4111-8111-111111111113',
        quantity: 1,
      },
    ],
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    establishmentId: '11111111-1111-4111-8111-111111111114',
    fixedPrice: 30,
    id: '11111111-1111-4111-8111-111111111115',
    name: 'Combo Açaí + Brownie',
    status: 'active' as const,
    type: 'combo' as const,
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
  },
  components: [
    {
      accompanimentNames: [],
      component: {
        kind: 'portion' as const,
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
        sizeId: '11111111-1111-4111-8111-111111111112',
        accompanimentIds: [],
      },
      configurationName: '500 ml',
      productName: 'Açaí',
      subtotal: 14,
      unitPrice: 14,
      validity: 'valid' as const,
    },
    {
      accompanimentNames: [],
      component: {
        kind: 'resale' as const,
        productId: '11111111-1111-4111-8111-111111111113',
        quantity: 1,
      },
      configurationName: 'Preço padrão',
      productName: 'Brownie',
      subtotal: 10,
      unitPrice: 10,
      validity: 'valid' as const,
    },
  ],
  normalPrice: 24,
  savings: -6,
}

describe('ComboDiscountForm pricing validation', () => {
  afterEach(cleanup)

  it('clears a pricing error when a quantity change makes the unchanged price valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <ComboDiscountForm
        initialDetails={initialDetails}
        isPending={false}
        mode='edit'
        onCancel={vi.fn()}
        onRequestStatusChange={vi.fn()}
        onSubmit={onSubmit}
        submitError={null}
      />,
    )

    fireEvent.submit(
      screen.getByLabelText('Nome do combo').closest('form') as HTMLFormElement,
    )
    expect(await screen.findByText(pricingError)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade de Açaí' }))

    await waitFor(() => expect(screen.queryByText(pricingError)).toBeNull())
    expect(screen.getByText('R$ 38,00')).toBeTruthy()
  })

  it('allows an inactive Combo price to meet or exceed the normal total', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <ComboDiscountForm
        initialDetails={{
          ...initialDetails,
          combo: { ...initialDetails.combo, status: 'inactive' },
        }}
        isPending={false}
        mode='edit'
        onCancel={vi.fn()}
        onRequestStatusChange={vi.fn()}
        onSubmit={onSubmit}
        submitError={null}
      />,
    )

    fireEvent.submit(
      screen.getByLabelText('Nome do combo').closest('form') as HTMLFormElement,
    )

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(screen.queryByText(pricingError)).toBeNull()
  })
})
