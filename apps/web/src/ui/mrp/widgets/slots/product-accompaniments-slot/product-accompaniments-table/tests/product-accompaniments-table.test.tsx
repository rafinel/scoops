import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentsTable } from '../index'

const createItem = (
  overrides: Partial<ProductAccompanimentDetails> = {},
): ProductAccompanimentDetails => ({
  id: 'link-1',
  accompanimentProductId: 'product-1',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 20,
  salePrice: 3,
  estimatedCost: 0.45,
  isGlobal: false,
  hasOtherPortionLinks: false,
  ...overrides,
})

describe('ProductAccompanimentsTable', () => {
  afterEach(cleanup)

  it('shows a saved product price and keeps manager row actions', () => {
    const onEdit = vi.fn()
    const onRemove = vi.fn()

    render(
      <ProductAccompanimentsTable
        items={[createItem()]}
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('Granola').textContent).toBe('Granola')
    expect(screen.getByText('R$ 3,00')).toBeTruthy()
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
        items={[createItem({ id: 'link-2', salePrice: 0 })]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByText('Granola')).toBeTruthy()
    expect(screen.getByText('Grátis')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'ACOMPANHAMENTO' })).toBeTruthy()
    expect(screen.queryByRole('columnheader', { name: 'AÇÕES' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar Granola' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover Granola' })).toBeNull()
  })

  it('renders rows in the received order and badges only global rows', () => {
    render(
      <ProductAccompanimentsTable
        items={[
          createItem({
            id: 'global-1',
            accompanimentProductName: 'Granola',
            isGlobal: true,
          }),
          createItem({
            id: 'global-2',
            accompanimentProductName: 'Leite condensado',
            isGlobal: true,
          }),
          createItem({ id: 'link-3', accompanimentProductName: 'Banana' }),
        ]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      'GranolaGlobal',
      'Leite condensadoGlobal',
      'Banana',
    ])
    expect(screen.getAllByText('Global')).toHaveLength(2)
    expect(within(rows[2] as HTMLElement).queryByText('Global')).toBeNull()
  })

  it('keeps the Global badge visible for Operators without actions', () => {
    render(
      <ProductAccompanimentsTable
        canManage={false}
        items={[createItem({ isGlobal: true })]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('Global')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remover Granola' })).toBeNull()
  })

  it('delegates removal of a global row with the row item', () => {
    const onRemove = vi.fn()
    const item = createItem({ isGlobal: true })
    render(
      <ProductAccompanimentsTable items={[item]} onEdit={vi.fn()} onRemove={onRemove} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remover Granola' }))

    expect(onRemove).toHaveBeenCalledWith(item)
  })
})
