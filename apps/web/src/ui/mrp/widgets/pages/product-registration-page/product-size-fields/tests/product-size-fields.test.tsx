import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductSizeFields, type ProductSizeFieldsProps } from '..'

const SIZES = [
  { id: 'size-0', name: 'Pequeno', quantity: '0,300', price: '9,90' },
  { id: 'size-1', name: 'Grande', quantity: '0,500', price: '14,50' },
]

function renderFields(overrides: Partial<ProductSizeFieldsProps> = {}) {
  const props: ProductSizeFieldsProps = {
    onAddSize: vi.fn(),
    onRemoveSize: vi.fn(),
    onSizeChange: vi.fn(),
    sizeErrors: SIZES.map(() => ({})),
    sizes: SIZES,
    unit: 'kg',
    ...overrides,
  }
  render(<ProductSizeFields {...props} />)
  return props
}

describe('ProductSizeFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('renders the title, the hint and the add action even with no rows', () => {
    renderFields({ sizeErrors: [], sizes: [] })

    expect(screen.getByRole('heading', { name: 'Tamanhos e preços' })).not.toBeNull()
    expect(
      screen.getByText(
        'Opcional. Sem um tamanho ativo, a porção fica indisponível no PDV.',
      ),
    ).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Adicionar tamanho' })).not.toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('renders each row with labeled fields, the typed values, the unit and the price prefix', () => {
    renderFields()

    for (const [index, size] of SIZES.entries()) {
      const row = screen.getByRole('group', { name: `Tamanho ${index + 1}` })
      expect(
        (
          within(row).getByRole('textbox', {
            name: `Nome do tamanho ${index + 1}`,
          }) as HTMLInputElement
        ).value,
      ).toBe(size.name)
      expect(
        (
          within(row).getByRole('textbox', {
            name: `Quantidade do tamanho ${index + 1}`,
          }) as HTMLInputElement
        ).value,
      ).toBe(size.quantity)
      expect(
        (
          within(row).getByRole('textbox', {
            name: `Preço do tamanho ${index + 1}`,
          }) as HTMLInputElement
        ).value,
      ).toBe(size.price)
      expect(within(row).getByText('kg')).not.toBeNull()
      expect(within(row).getByText('R$')).not.toBeNull()
      expect(
        within(row).getByRole('button', { name: `Remover tamanho ${index + 1}` }),
      ).not.toBeNull()
    }
  })

  it('shows the unit of the product beside every quantity', () => {
    renderFields({ unit: 'g' })

    expect(screen.getAllByText('g')).toHaveLength(SIZES.length)
  })

  it('keeps the tab order Nome, Quantidade, Preço and Remover within each row', () => {
    renderFields()

    const row = screen.getByRole('group', { name: 'Tamanho 1' })
    const focusable = [...row.querySelectorAll('input, button')].map((element) =>
      element.getAttribute('aria-label'),
    )
    expect(focusable).toEqual([
      'Nome do tamanho 1',
      'Quantidade do tamanho 1',
      'Preço do tamanho 1',
      'Remover tamanho 1',
    ])
  })

  it('shows each field error beside its field and describes the invalid input by it', () => {
    renderFields({
      sizeErrors: [
        {},
        {
          name: 'Informe o nome do tamanho.',
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
          price: 'Informe um preço válido, com até duas casas decimais.',
        },
      ],
    })

    const first = screen.getByRole('textbox', { name: 'Nome do tamanho 1' })
    expect(first.getAttribute('aria-invalid')).toBe('false')
    expect(first.getAttribute('aria-describedby')).toBeNull()
    for (const [label, message] of [
      ['Nome do tamanho 2', 'Informe o nome do tamanho.'],
      [
        'Quantidade do tamanho 2',
        'Informe uma quantidade maior que zero, com até três casas decimais.',
      ],
      ['Preço do tamanho 2', 'Informe um preço válido, com até duas casas decimais.'],
    ] as const) {
      const input = screen.getByRole('textbox', { name: label })
      const error = screen.getByText(message)
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.getAttribute('aria-describedby')).toBe(error.id)
    }
  })

  it('delegates field changes, removals and additions with the row id', () => {
    const props = renderFields()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome do tamanho 2' }), {
      target: { value: 'Mega' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Quantidade do tamanho 1' }), {
      target: { value: '1,2' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Preço do tamanho 1' }), {
      target: { value: '11,00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remover tamanho 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tamanho' }))

    expect(props.onSizeChange).toHaveBeenNthCalledWith(1, 'size-1', { name: 'Mega' })
    expect(props.onSizeChange).toHaveBeenNthCalledWith(2, 'size-0', { quantity: '1,2' })
    expect(props.onSizeChange).toHaveBeenNthCalledWith(3, 'size-0', { price: '11,00' })
    expect(props.onRemoveSize).toHaveBeenCalledWith('size-1')
    expect(props.onAddSize).toHaveBeenCalledOnce()
  })
})
