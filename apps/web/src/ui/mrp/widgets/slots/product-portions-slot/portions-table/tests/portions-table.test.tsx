import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { PortionsTable, type PortionsTableProps } from '../index'

const baseRow: AccompanimentPortionDetails = {
  id: 'link-1',
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 50,
  salePrice: 3,
  isGlobal: false,
  hasOtherPortionLinks: true,
  portionProductId: 'portion-1',
  portionProductName: 'Açaí 300 ml',
}

function renderTable(overrides: Partial<PortionsTableProps> = {}) {
  const props: PortionsTableProps = {
    canManage: true,
    inactiveNoticeId: 'inactive-notice',
    isActive: true,
    items: [baseRow],
    onEdit: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  }
  render(<PortionsTable {...props} />)
  return props
}

describe('PortionsTable', () => {
  afterEach(cleanup)

  it('renders the Manager columns and the Portion, type, quantity with unit and price', () => {
    renderTable()

    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['PORÇÃO', 'TIPO', 'QTD POR PORÇÃO', 'PREÇO', 'AÇÕES'])
    const row = screen.getAllByRole('row')[1]
    expect(within(row).getByRole('cell', { name: 'Açaí 300 ml' })).toBeTruthy()
    expect(within(row).getByRole('cell', { name: 'Cobertura' })).toBeTruthy()
    expect(within(row).getByRole('cell', { name: '50 g' })).toBeTruthy()
    expect(within(row).getByRole('cell', { name: /R\$\s*3,00/ })).toBeTruthy()
  })

  it('omits the Actions column and every control for Operators', () => {
    renderTable({ canManage: false })

    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['PORÇÃO', 'TIPO', 'QTD POR PORÇÃO', 'PREÇO'])
    expect(screen.queryByRole('button')).toBeNull()
  })

  it.each([
    [0, 'Grátis'],
    [null, 'Não configurado'],
  ])('shows the price %s as %s on the row', (salePrice, label) => {
    renderTable({ items: [{ ...baseRow, salePrice }] })

    expect(screen.getAllByRole('row')[1].textContent).toContain(label)
  })

  it('shows each link its own price when the rows of an individual Accompaniment differ', () => {
    renderTable({
      items: [
        { ...baseRow, salePrice: 4.5 },
        {
          ...baseRow,
          id: 'link-2',
          portionProductId: 'portion-2',
          portionProductName: 'Açaí 500 ml',
          salePrice: 0,
        },
        {
          ...baseRow,
          id: 'link-3',
          portionProductId: 'portion-3',
          portionProductName: 'Açaí 700 ml',
          salePrice: null,
        },
      ],
    })

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByRole('cell', { name: /R\$\s*4,50/ })).toBeTruthy()
    expect(within(rows[2]).getByRole('cell', { name: 'Grátis' })).toBeTruthy()
    expect(within(rows[3]).getByRole('cell', { name: 'Não configurado' })).toBeTruthy()
  })

  it('formats a fractional quantity with the unit', () => {
    renderTable({ items: [{ ...baseRow, quantityPerPortion: 0.5, unit: 'kg' }] })

    expect(screen.getByRole('cell', { name: '0,5 kg' })).toBeTruthy()
  })

  it('offers Editar and Remover named after the Portion for an individual row', () => {
    const { onEdit, onRemove } = renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Açaí 300 ml' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Açaí 300 ml' }))

    expect(onEdit).toHaveBeenCalledWith(baseRow)
    expect(onRemove).toHaveBeenCalledWith(baseRow)
    expect(screen.queryByRole('button', { name: /desta porção/ })).toBeNull()
  })

  it('offers only Remover desta porção, named after the Accompaniment and Portion, for a global row', () => {
    const globalRow = { ...baseRow, isGlobal: true }
    const { onRemove } = renderTable({ items: [globalRow] })

    const button = screen.getByRole('button', {
      name: 'Remover Granola desta porção: Açaí 300 ml',
    })
    expect(button.textContent).toContain('Remover desta porção')
    fireEvent.click(button)

    expect(onRemove).toHaveBeenCalledWith(globalRow)
    expect(screen.queryByRole('button', { name: /^Editar/ })).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('disables Editar for an inactive Accompaniment, describes it by the notice and keeps Remover enabled', () => {
    renderTable({ isActive: false })

    const edit = screen.getByRole('button', { name: 'Editar Açaí 300 ml' })
    expect(edit.hasAttribute('disabled')).toBe(true)
    expect(edit.getAttribute('aria-describedby')).toBe('inactive-notice')
    expect(
      screen
        .getByRole('button', { name: 'Remover Açaí 300 ml' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('keeps Remover desta porção enabled for a global row of an inactive Accompaniment', () => {
    renderTable({ isActive: false, items: [{ ...baseRow, isGlobal: true }] })

    expect(
      screen
        .getByRole('button', { name: /Remover Granola desta porção/ })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('renders one row per item with an accessible caption', () => {
    renderTable({
      items: [
        baseRow,
        {
          ...baseRow,
          id: 'link-2',
          portionProductId: 'portion-2',
          portionProductName: 'Açaí 500 ml',
        },
      ],
    })

    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('region', { name: 'Tabela de porções' })).toBeTruthy()
    expect(screen.getByText('Porções com este acompanhamento')).toBeTruthy()
  })

  it('makes the scroll region keyboard reachable for Operators, who have no row buttons', () => {
    renderTable({ canManage: false })

    const region = screen.getByRole('region', { name: 'Tabela de porções' })
    expect(region.getAttribute('tabindex')).toBe('0')
  })

  it('keeps the scroll region out of the Manager tab order', () => {
    renderTable()

    const region = screen.getByRole('region', { name: 'Tabela de porções' })
    expect(region.getAttribute('tabindex')).toBeNull()
  })
})
