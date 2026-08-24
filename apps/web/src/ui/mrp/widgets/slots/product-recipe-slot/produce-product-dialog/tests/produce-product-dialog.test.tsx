import { fireEvent, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'

import { ProduceProductDialog } from '../index'
import { useProduceProductDialog } from '../use-produce-product-dialog'

vi.mock('../use-produce-product-dialog', () => ({ useProduceProductDialog: vi.fn() }))
const mockedDialog = vi.mocked(useProduceProductDialog)
const product = ProductFaker.fake({ id: 'product-1', name: 'Sorvete', unit: 'un' })
const recipe = {
  id: 'recipe-1',
  yieldQuantity: 10,
  totalCost: 12,
  unitCost: 1.2,
  maximumProducibleQuantity: 30,
  ingredients: [],
}
const preview = {
  canProduce: true,
  blockReasons: [],
  consumptions: [],
  totalCost: 12,
  currentOutputStock: 0,
  projectedOutputStock: 20,
}

describe('ProduceProductDialog', () => {
  it('renders the projection and delegates mode and confirmation actions', () => {
    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()
    const handleModeChange = vi.fn()
    const handleConfirm = vi.fn()
    mockedDialog.mockReturnValue({
      error: null,
      isPending: false,
      isInputValid: true,
      mode: 'batches',
      preview: { data: preview, isPending: false, isError: false, refetch: vi.fn() },
      quantity: 10,
      validationError: null,
      value: '1',
      handleConfirm,
      handleModeChange,
      setValue: vi.fn(),
    } as never)

    render(
      <ProduceProductDialog
        open
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        product={product}
        recipe={recipe}
      />,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Registrar produção' })).toBeTruthy()
    expect(screen.getByText('Equivale a 10 un')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Quantidade' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar produção' }))

    expect(handleModeChange).toHaveBeenCalledWith('quantity')
    expect(handleConfirm).toHaveBeenCalledWith(onSuccess)
  })
})
