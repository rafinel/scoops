import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductSalePriceFields, type ProductSalePriceFieldsProps } from '..'

const HINT = 'Opcional. Sem preço, o produto fica indisponível no PDV.'
const RESALE_LABEL = 'Preço de revenda'
const ACCOMPANIMENT_LABEL = 'Preço como acompanhamento'

const registerMock = vi.fn((name: string) => ({ name })) as never

function renderFields(overrides: Partial<ProductSalePriceFieldsProps> = {}) {
  return render(
    <ProductSalePriceFields
      accompanimentPrice=''
      fieldErrors={{}}
      isAccompanimentPriceVisible={false}
      isResalePriceVisible={false}
      onAccompanimentPriceChange={vi.fn()}
      onResalePriceChange={vi.fn()}
      register={registerMock}
      resalePrice=''
      {...overrides}
    />,
  )
}

describe('ProductSalePriceFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('renders nothing when neither price field is visible', () => {
    const { container } = renderFields()

    expect(container.firstChild).toBeNull()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it.each([
    ['only the Resale price', true, false, [RESALE_LABEL]],
    ['only the Accompaniment price', false, true, [ACCOMPANIMENT_LABEL]],
    ['both prices in order', true, true, [RESALE_LABEL, ACCOMPANIMENT_LABEL]],
  ])(
    'shows %s',
    (_name, isResalePriceVisible, isAccompanimentPriceVisible, expectedLabels) => {
      renderFields({ isAccompanimentPriceVisible, isResalePriceVisible })

      expect(
        screen.getAllByRole('textbox').map((input) => input.getAttribute('id')),
      ).toEqual(
        expectedLabels.map((label) =>
          label === RESALE_LABEL ? 'resale-price-input' : 'accompaniment-price-input',
        ),
      )
      for (const label of expectedLabels) {
        expect(screen.getByRole('textbox', { name: label })).toBeDefined()
      }
      expect(screen.getAllByText(HINT)).toHaveLength(expectedLabels.length)
    },
  )

  it('presents an optional affixed decimal field with the R$ prefix, placeholder and hint', () => {
    renderFields({ isResalePriceVisible: true })

    const input = screen.getByRole('textbox', { name: RESALE_LABEL }) as HTMLInputElement
    expect(screen.getByText('R$')).toBeDefined()
    expect(input.type).toBe('text')
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.placeholder).toBe('0,00')
    expect(input.getAttribute('data-focus-ring')).toBe('delegated')
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.getAttribute('aria-describedby')).toBe('resale-price-hint')
    expect(screen.getByText(HINT).id).toBe('resale-price-hint')
    expect(registerMock).toHaveBeenCalledWith('resalePrice')
  })

  it('shows each typed value, including a decimal comma', () => {
    renderFields({
      accompanimentPrice: '0',
      isAccompanimentPriceVisible: true,
      isResalePriceVisible: true,
      resalePrice: '12,50',
    })

    expect(
      (screen.getByRole('textbox', { name: RESALE_LABEL }) as HTMLInputElement).value,
    ).toBe('12,50')
    expect(
      (screen.getByRole('textbox', { name: ACCOMPANIMENT_LABEL }) as HTMLInputElement)
        .value,
    ).toBe('0')
    expect(registerMock).toHaveBeenCalledWith('accompanimentPrice')
  })

  it('delegates each change to its own handler', () => {
    const onAccompanimentPriceChange = vi.fn()
    const onResalePriceChange = vi.fn()
    renderFields({
      isAccompanimentPriceVisible: true,
      isResalePriceVisible: true,
      onAccompanimentPriceChange,
      onResalePriceChange,
    })

    fireEvent.change(screen.getByRole('textbox', { name: RESALE_LABEL }), {
      target: { value: '12,00' },
    })
    expect(onResalePriceChange).toHaveBeenCalledExactlyOnceWith('12,00')
    expect(onAccompanimentPriceChange).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox', { name: ACCOMPANIMENT_LABEL }), {
      target: { value: '9' },
    })
    expect(onAccompanimentPriceChange).toHaveBeenCalledExactlyOnceWith('9')
    expect(onResalePriceChange).toHaveBeenCalledOnce()
  })

  it('links each error to its field and marks only that field invalid', () => {
    renderFields({
      fieldErrors: { resalePrice: 'Preço de revenda inválido.' },
      isAccompanimentPriceVisible: true,
      isResalePriceVisible: true,
    })

    const resalePrice = screen.getByRole('textbox', { name: RESALE_LABEL })
    expect(resalePrice.getAttribute('aria-invalid')).toBe('true')
    expect(resalePrice.getAttribute('aria-describedby')).toBe(
      'resale-price-hint resale-price-error',
    )
    expect(screen.getByText('Preço de revenda inválido.').id).toBe('resale-price-error')

    const accompanimentPrice = screen.getByRole('textbox', { name: ACCOMPANIMENT_LABEL })
    expect(accompanimentPrice.getAttribute('aria-invalid')).toBe('false')
    expect(accompanimentPrice.getAttribute('aria-describedby')).toBe(
      'accompaniment-price-hint',
    )
  })

  it('does not show an error for a hidden field', () => {
    renderFields({
      fieldErrors: { accompanimentPrice: 'Preço inválido.' },
      isResalePriceVisible: true,
    })

    expect(screen.queryByText('Preço inválido.')).toBeNull()
  })
})
