import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductAccompanimentsTable } from '../index'

describe('ProductAccompanimentsTable', () => {
  afterEach(cleanup)

  it('exposes unavailable source and price without hiding the row', () => {
    const onEdit = vi.fn()
    const onRemove = vi.fn()

    render(
      <ProductAccompanimentsTable
        items={[
          {
            id: 'link-1',
            accompanimentProductId: 'product-1',
            accompanimentProductName: 'Granola',
            accompanimentTypeId: 'type-1',
            accompanimentTypeName: 'Cobertura',
            unit: 'g',
            quantityPerPortion: 20,
            estimatedCost: 0.45,
          },
        ]}
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('Granola').textContent).toBe('Granola')
    expect(screen.getAllByText('Não disponível')).toHaveLength(1)
    expect(
      screen.getByLabelText(/preço comercial é configurado por tamanho no PDV/i),
    ).toBeTruthy()
    expect(screen.getByText('Indisponível')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Granola' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Granola' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('keeps accompaniment facts visible without row actions for Operators', () => {
    render(
      <ProductAccompanimentsTable
        canManage={false}
        items={[
          {
            id: 'link-2',
            accompanimentProductId: 'product-2',
            accompanimentProductName: 'Granola',
            accompanimentTypeId: 'type-1',
            accompanimentTypeName: 'Cobertura',
            unit: 'g',
            quantityPerPortion: 20,
            estimatedCost: 0.45,
          },
        ]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByText('Granola')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'ACOMPANHAMENTO' })).toBeTruthy()
    expect(screen.queryByRole('columnheader', { name: 'AÇÕES' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar Granola' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover Granola' })).toBeNull()
  })
})
